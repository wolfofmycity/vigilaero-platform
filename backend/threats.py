from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from uuid import uuid4
import json
from typing import Optional, Dict, Any, List

from .auth import get_current_user
from . import db
from .auth import USERS

router = APIRouter(prefix="/api/threats", tags=["threats"])
inc_router = APIRouter(prefix="/incidents", tags=["incidents"])


# ============================
# Phase 12E (Option A): Operator attribution (backend-only)
# ============================
# - Maintain a small SQLite table: drone_assignments(drone_id -> operator)
# - Resolve actor as: assigned operator (if exists) else authenticated user
# - Keep a single pilot login (admin/admin)
# - No UI changes
# ============================


class DroneAssignmentRequest(BaseModel):
    drone_id: str
    operator: str


class ThreatRunRequest(BaseModel):
    company_id: Optional[str] = None
    drone_id: Optional[str] = None
    threat_type: str
    training: bool = True


class MitigationRequest(BaseModel):
    action: str


def _ensure_drone_assignments_table() -> None:
    conn = db.connect()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS drone_assignments (
                drone_id TEXT PRIMARY KEY,
                operator TEXT NOT NULL,
                assigned_at TEXT NOT NULL,
                assigned_by TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _get_assigned_operator(drone_id: str) -> Optional[str]:
    _ensure_drone_assignments_table()
    conn = db.connect()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT operator FROM drone_assignments WHERE drone_id=?",
            (drone_id,),
        )
        row = cur.fetchone()
        # row may be a tuple or sqlite3.Row depending on connection config
        if not row:
            return None
        return row[0] if not isinstance(row, dict) else row.get("operator")
    finally:
        conn.close()


def _set_assigned_operator(drone_id: str, operator: str, assigned_by: Optional[str]) -> None:
    _ensure_drone_assignments_table()
    conn = db.connect()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO drone_assignments (drone_id, operator, assigned_at, assigned_by)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(drone_id) DO UPDATE SET
                operator=excluded.operator,
                assigned_at=excluded.assigned_at,
                assigned_by=excluded.assigned_by
            """,
            (
                drone_id,
                operator,
                datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
                assigned_by,
            ),
        )
        conn.commit()
    finally:
        conn.close()


@router.post("/assign_operator")
def assign_operator(req: DroneAssignmentRequest, user=Depends(get_current_user)):
    # --- actor context from JWT (non-repudiation) ---
    user = user or {}
    actor = user.get("username") or "admin"
    role = (user.get("role") or "admin").lower()
    company_id = user.get("company_id") or "default"

    # --- 12F governance guardrail: role reservation (no RBAC explosion yet) ---
    if role not in {"admin"}:
        raise HTTPException(status_code=403, detail="Insufficient role for operator assignment")

    # --- 12F governance guardrail: prevent arbitrary operator strings (DEV mode) ---
    # NOTE: Today, valid operators are the known usernames in auth.USERS.
    # Later, this becomes an Operators table / org directory.
    if req.operator not in USERS:
        raise HTTPException(status_code=400, detail="Unknown operator")

    # ✅ NEW: only emit evidence if operator actually changes
    current = _get_assigned_operator(req.drone_id)
    if current == req.operator:
        return {"ok": True, "drone_id": req.drone_id, "operator": req.operator, "unchanged": True}

    # --- state change ---
    _set_assigned_operator(req.drone_id, req.operator, assigned_by=actor)

    # --- append-only evidence event (Security Evidence Chain) ---
    db.add_forensic_event(
        company_id=company_id,
        drone_id=req.drone_id,
        incident_id=None,
        event_type="operator_assigned",
        actor=actor,                       # MUST come from JWT
        action="assign_operator",
        result="ok",
        payload_json=json.dumps({"assigned_operator": req.operator, "actor_role": role}),
    )

    return {"ok": True, "drone_id": req.drone_id, "operator": req.operator}


@router.get("/templates")
def get_templates():
    # Keep it simple; frontend expects templates list
    return {
        "ok": True,
        "templates": [
            {"id": "gps_spoof", "name": "GPS Spoofing", "severity": "high"},
            {"id": "rf_link_hijack", "name": "RF Link Hijack", "severity": "critical"},
            {"id": "firmware_tamper", "name": "Firmware Tamper", "severity": "high"},
        ],
    }


@router.post("/run")
def run_threat(req: ThreatRunRequest, user=Depends(get_current_user)):
    # identity boundary
    user = user or {}
    actor = user.get("username") or "admin"
    role = (user.get("role") or "admin").lower()
    company_id = req.company_id or user.get("company_id") or "default"

    operator = _get_assigned_operator(req.drone_id)  # store operator on incident when available

    incident_id = f"INC-{uuid4().hex[:12]}"

    severity = "critical" if req.threat_type == "rf_link_hijack" else "high"
    title = req.threat_type.replace("_", " ").title()

    # 1) Forensics: simulation started
    db.add_forensic_event(
        company_id=company_id,
        drone_id=req.drone_id,
        incident_id=None,
        event_type="simulation_started",
        actor=actor,
        action=req.threat_type,
        result="ok",
        payload_json=json.dumps({"training": req.training, "actor_role": role}),
    )

    # 2) Create incident (with operator if assigned)
    incident = db.create_incident(
        incident_id=incident_id,
        company_id=company_id,
        drone_id=req.drone_id,
        threat_type=req.threat_type,
        severity=severity,
        title=title,
        training=req.training,
        details=json.dumps({"source": "threat_simulation"}),
        operator=operator,
    )

    # 3) Forensics: incident created
    db.add_forensic_event(
        company_id=company_id,
        drone_id=req.drone_id,
        incident_id=incident_id,
        event_type="incident_created",
        actor=actor,
        action=req.threat_type,
        result="ok",
        payload_json=json.dumps(
            {
                "severity": severity,
                "title": title,
                "training": req.training,
                "actor_role": role,
                "operator": operator,
            }
        ),
    )

    return {"ok": True, "incident": incident}


@inc_router.get("/active")
def get_active_incidents(user=Depends(get_current_user)):
    company_id = (user or {}).get("company_id") or "default"
    incidents = db.list_active_incidents(company_id=company_id, drone_id=None)
    return {"ok": True, "incidents": incidents}


@inc_router.post("/{incident_id}/mitigate")
def mitigate(incident_id: str, req: MitigationRequest, user=Depends(get_current_user)):
    user = user or {}
    actor = user.get("username") or "admin"
    actor_role = (user.get("role") or "admin").lower()

    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    operator = inc.get("operator")  # or _get_assigned_operator(inc.get("drone_id"))

    updated = db.update_incident_status(
        incident_id=incident_id,
        new_status="mitigated",
        mitigated_action=req.action,
        details=f"Mitigation executed (training): {req.action}",
    )

    db.add_forensic_event(
        company_id=inc["company_id"],
        drone_id=inc.get("drone_id"),
        incident_id=incident_id,
        event_type="mitigation_action_executed",
        actor=actor,  # JWT actor ONLY
        action=req.action,
        result="ok",
        payload_json=json.dumps(
            {"training": True, "actor_role": actor_role, "operator": operator}
        ),
    )

    return {"ok": True, "incident": updated}


@inc_router.post("/{incident_id}/close")
def close(incident_id: str, user=Depends(get_current_user)):
    user = user or {}
    actor = user.get("username") or "admin"
    actor_role = (user.get("role") or "admin").lower()

    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    operator = inc.get("operator")  # keep separate from actor

    updated = db.update_incident_status(
        incident_id=incident_id,
        new_status="closed",
    )

    db.add_forensic_event(
        company_id=inc["company_id"],
        drone_id=inc.get("drone_id"),
        incident_id=incident_id,
        event_type="incident_closed",
        actor=actor,  # JWT actor ONLY
        action="close",
        result="ok",
        payload_json=json.dumps(
            {"training": True, "actor_role": actor_role, "operator": operator}
        ),
    )

    return {"ok": True, "incident": updated}
