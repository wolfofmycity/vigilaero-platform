from __future__ import annotations

from typing import Dict, Optional
from datetime import datetime, timezone
import hashlib
import json

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .auth import router as auth_router, require_token
from . import threats as threats_mod
from . import db

app = FastAPI(title="VigilAero Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    db.init_db()


def _actor_from_user(user: dict) -> str:
    return (user or {}).get("username") or (user or {}).get("sub") or "unknown"


def _role_from_user(user: dict) -> str:
    return (user or {}).get("role") or "unknown"


# ─────────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────────
app.include_router(auth_router)

# threats + incidents (native)
app.include_router(threats_mod.router)       # /threats/*
app.include_router(threats_mod.inc_router)   # /incidents/*

# mirror under /api (frontend uses these)
app.include_router(threats_mod.router, prefix="/api")      # /api/threats/*
app.include_router(threats_mod.inc_router, prefix="/api")  # /api/incidents/*


# ─────────────────────────────────────────────────────────────
# Security endpoints
# ─────────────────────────────────────────────────────────────
security_router = APIRouter(prefix="/security", tags=["security"])


@security_router.get("/zerotrust")
def get_zerotrust(user=Depends(require_token)):
    company_id = user.get("company_id") or "default"
    row = db.get_zerotrust_policy(company_id)
    return {"ok": True, "policy": row["policy_json"], "updated_at": row["updated_at"]}


class ZeroTrustUpdate(BaseModel):
    policy: str


@security_router.post("/zerotrust")
def set_zerotrust(body: ZeroTrustUpdate, user=Depends(require_token)):
    company_id = user.get("company_id") or "default"
    db.set_zerotrust_policy(company_id, body.policy)
    row = db.get_zerotrust_policy(company_id)
    return {"ok": True, "policy": row["policy_json"], "updated_at": row["updated_at"]}


@security_router.get("/events")
def security_events(
    drone_id: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    user=Depends(require_token),
):
    company_id = user.get("company_id") or "default"
    items = db.list_forensics(company_id=company_id, drone_id=drone_id, limit=limit)
    return {"ok": True, "events": items}


app.include_router(security_router)
app.include_router(security_router, prefix="/api")


# ─────────────────────────────────────────────────────────────
# NEW: Pilot-friendly alias endpoint (report backbone)
# GET /api/forensics?drone_id=UA-101
# ─────────────────────────────────────────────────────────────
forensics_router = APIRouter(prefix="/api", tags=["forensics"])


@forensics_router.get("/forensics")
def get_forensics(
    drone_id: Optional[str] = Query(default=None),
    incident_id: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    user=Depends(require_token),
):
    company_id = user.get("company_id") or "default"
    items = db.list_forensics(
        company_id=company_id,
        drone_id=drone_id,
        incident_id=incident_id,
        limit=limit,
    )
    return {"ok": True, "events": items}


@forensics_router.get("/evidence")
def get_evidence(
    framework_id: Optional[str] = Query(default=None),
    control_id: Optional[str] = Query(default=None),
    drone_id: Optional[str] = Query(default=None),
    incident_id: Optional[str] = Query(default=None),
    date_from: Optional[str] = Query(default=None),  # YYYY-MM-DD
    date_to: Optional[str] = Query(default=None),    # YYYY-MM-DD
    limit: int = Query(default=200, ge=1, le=500),
    user=Depends(require_token),
):
    company_id = user.get("company_id") or "default"
    items = db.list_evidence(
        company_id=company_id,
        framework_id=framework_id,
        control_id=control_id,
        drone_id=drone_id,
        incident_id=incident_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
    )
    return {"ok": True, "evidence": items}


@forensics_router.get("/evidence/summary")
def get_evidence_summary(
    framework_id: str = Query(...),
    drone_id: Optional[str] = Query(default=None),
    date_from: Optional[str] = Query(default=None),  # YYYY-MM-DD
    date_to: Optional[str] = Query(default=None),    # YYYY-MM-DD
    user=Depends(require_token),
):
    company_id = user.get("company_id") or "default"

    rows = db.evidence_summary_by_control(
        company_id=company_id,
        framework_id=framework_id,
        drone_id=drone_id,
        date_from=date_from,
        date_to=date_to,
    )

    accepted_by_control: Dict[str, int] = {}
    pending_by_control: Dict[str, int] = {}
    rejected_by_control: Dict[str, int] = {}
    total_by_control: Dict[str, int] = {}

    for r in rows:
        cid = r["control_id"]
        accepted_by_control[cid] = int(r.get("accepted") or 0)
        pending_by_control[cid] = int(r.get("pending") or 0)
        rejected_by_control[cid] = int(r.get("rejected") or 0)
        total_by_control[cid] = int(r.get("total") or 0)

    scope = "drone" if drone_id else "org"

    return {
        "ok": True,
        "framework_id": framework_id,
        "scope": scope,
        "accepted_by_control": accepted_by_control,
        "pending_by_control": pending_by_control,
        "rejected_by_control": rejected_by_control,
        "total_by_control": total_by_control,
    }


class EvidenceCreateRequest(BaseModel):
    framework_id: str
    control_id: str
    evidence_type: str
    reference_id: Optional[str] = None
    drone_id: Optional[str] = None
    incident_id: Optional[str] = None
    attestation: str


@forensics_router.post("/evidence")
def create_evidence(
    body: EvidenceCreateRequest,
    user=Depends(require_token),
):
    company_id = user.get("company_id") or "default"

    item = db.create_evidence(
        company_id=company_id,
        drone_id=body.drone_id,
        incident_id=body.incident_id,
        framework_id=body.framework_id,
        control_id=body.control_id,
        evidence_type=body.evidence_type,
        source_event_id=None,  # manual attach v1
        reference_id=body.reference_id,
        attestation=body.attestation,
    )
    return {"ok": True, "evidence": item}


class EvidenceReviewRequest(BaseModel):
    decision: str  # accepted | rejected
    note: Optional[str] = None


@forensics_router.post("/evidence/{evidence_id}/review")
def review_evidence(
    evidence_id: int,
    body: EvidenceReviewRequest,
    user=Depends(require_token),
):
    company_id = user.get("company_id") or "default"
    role = (user.get("role") or "").lower()
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    decision = (body.decision or "").lower()
    if decision not in {"accepted", "rejected"}:
        raise HTTPException(status_code=400, detail="decision must be accepted or rejected")

    item = db.review_evidence(
        company_id=company_id,
        evidence_id=evidence_id,
        review_status=decision,
        reviewed_by=user.get("username") or "unknown",
        review_note=body.note,
    )
    if not item:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return {"ok": True, "evidence": item}


@forensics_router.get("/forensics/bundle")
def export_forensics_bundle(
    incident_id: str = Query(...),
    user=Depends(require_token),
):
    """
    Evidence Bundle Export v0
    System-generated snapshot for audits/pilots.
    """
    user = user or {}
    actor = user.get("username") or "unknown"
    role = user.get("role") or "unknown"
    company_id = user.get("company_id") or "default"

    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Prevent cross-tenant export
    if incident.get("company_id") != company_id:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Pull append-only event timeline
    events = db.list_forensics(
        company_id=company_id,
        drone_id=incident.get("drone_id"),
        incident_id=incident_id,
        limit=1000,
    )
    events = sorted(
        events,
        key=lambda event: (
            event.get("ts") or "",
            event.get("id") or "",
        ),
    )

    bundle = {
        "schema_version": "12F.export.v0",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "generated_by": {"actor": actor, "role": role, "company_id": company_id},
        "disclaimer": "System-generated snapshot of append-only evidence events + incident state. Not user-editable.",
        "incident": incident,
        "events": events,
    }

    stable_for_hash = {
        "schema_version": bundle["schema_version"],
        "generated_by": bundle["generated_by"],
        "disclaimer": bundle["disclaimer"],
        "incident": bundle["incident"],
        "events": bundle["events"],
    }

    canonical = json.dumps(
        stable_for_hash,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    bundle["bundle_sha256"] = hashlib.sha256(canonical).hexdigest()

    return {"ok": True, "bundle": bundle}


app.include_router(forensics_router)


# ─────────────────────────────────────────────────────────────
# Legacy compatibility endpoint: /api/incident/respond
# ─────────────────────────────────────────────────────────────
incident_api = APIRouter(prefix="/api/incident", tags=["incidents"])


class IncidentRespondRequest(BaseModel):
    drone_id: str
    response_id: str
    response_name: str


@incident_api.post("/respond")
def respond_to_incident(req: IncidentRespondRequest, user=Depends(require_token)):
    company_id = user.get("company_id") or "default"
    actor = _actor_from_user(user)
    actor_role = _role_from_user(user)

    active = db.list_active_incidents(company_id=company_id, drone_id=req.drone_id)
    if not active:
        raise HTTPException(status_code=404, detail="No active incident for this drone")

    inc = active[0]

    updated = db.update_incident_status(
        incident_id=inc["incident_id"],
        new_status="mitigated",
        details=f"Mitigation executed (training): {req.response_name}",
        mitigated_action=req.response_id,
    )

    # Standardize event name to the canonical one
    db.add_forensic_event(
        company_id=company_id,
        drone_id=req.drone_id,
        incident_id=inc["incident_id"],
        event_type="mitigation_action_executed",
        actor=actor,
        action=req.response_id,
        result="ok",
        payload_json=json.dumps(
            {
                "response_id": req.response_id,
                "response_name": req.response_name,
                "training": True,
                "actor_role": actor_role,
            }
        ),
    )

    return {
        "ok": True,
        "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "incident": updated,
    }


app.include_router(incident_api)
