from __future__ import annotations

from pathlib import Path
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).with_name("vigil.db")

ALLOWED_INCIDENT_UPDATE_FIELDS = {
    "status",
    "updated_at",
    "details",
    "mitigated_action",
    "mitigated_at",
    "closed_at",
}

ALLOWED_FORENSICS_FILTERS = {
    "drone_id",
    "incident_id",
    "event_type",
    "actor",
    "action",
    "result",
}


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _day_bounds_utc(date_str: str, end: bool) -> str:
    # date_str = "YYYY-MM-DD"
    dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    if end:
        # inclusive end-of-day
        dt = dt + timedelta(days=1) - timedelta(microseconds=1)
    return dt.isoformat()


def _table_columns(conn: sqlite3.Connection, table: str) -> List[str]:
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    rows = cur.fetchall()
    return [r["name"] for r in rows] if rows else []


def _ensure_column(conn: sqlite3.Connection, table: str, col: str, decl: str) -> None:
    cols = _table_columns(conn, table)
    if col in cols:
        return
    cur = conn.cursor()
    cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {decl}")


def init_db() -> None:
    """
    Create tables safely and apply lightweight migrations.
    MUST NOT crash if an old vigil.db exists with older schemas.
    """
    conn = connect()
    cur = conn.cursor()

    # --- users table (kept for compatibility; auth.py uses in-memory USERS) ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE
        )
        """
    )
    _ensure_column(conn, "users", "password", "TEXT")
    _ensure_column(conn, "users", "password_hash", "TEXT")
    _ensure_column(conn, "users", "role", "TEXT")
    _ensure_column(conn, "users", "company_id", "TEXT")

    # --- Zero Trust legacy config (kept) ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS zerotrust (
            company_id TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 1,
            roles TEXT DEFAULT 'Admin,Operator',
            timeout INTEGER DEFAULT 15
        )
        """
    )

    # --- Zero Trust policy blob (what main.py expects) ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS zerotrust_policy (
            company_id TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    # --- Telemetry ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT NOT NULL,
            drone_id TEXT NOT NULL,
            status TEXT NOT NULL,
            battery INTEGER,
            link_quality INTEGER,
            gps_health INTEGER,
            last_seen TEXT
        )
        """
    )

    # --- Incidents (pilot persistence) ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS incidents (
            incident_id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            drone_id TEXT,
            threat_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL,              -- active | mitigated | closed
            training INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            details TEXT,
            mitigated_action TEXT,
            mitigated_at TEXT,
            closed_at TEXT
        )
        """
    )
    # ✅ Option A (12E): operator attribution (safe migration)
    _ensure_column(conn, "incidents", "operator", "TEXT")

    # --- Forensics (audit backbone) ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS forensics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            company_id TEXT NOT NULL,
            drone_id TEXT,
            incident_id TEXT,
            event_type TEXT NOT NULL,
            actor TEXT,
            action TEXT,
            result TEXT,
            payload_json TEXT
        )
        """
    )

    # --- Evidence registry ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS evidence_registry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT NOT NULL,
            drone_id TEXT,
            incident_id TEXT,
            framework_id TEXT NOT NULL,
            control_id TEXT NOT NULL,
            evidence_type TEXT NOT NULL,
            source_event_id INTEGER,
            reference_id TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_evidence_company_framework_control_created ON evidence_registry(company_id, framework_id, control_id, created_at)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_evidence_company_framework_control ON evidence_registry(company_id, framework_id, control_id)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_evidence_company_framework_drone_control ON evidence_registry(company_id, framework_id, drone_id, control_id)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_evidence_company_framework_created ON evidence_registry(company_id, framework_id, created_at)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_evidence_company_drone_created ON evidence_registry(company_id, drone_id, created_at)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_evidence_company_incident_created ON evidence_registry(company_id, incident_id, created_at)"
    )
    _ensure_column(conn, "evidence_registry", "drone_id", "TEXT")
    _ensure_column(conn, "evidence_registry", "incident_id", "TEXT")
    _ensure_column(conn, "evidence_registry", "framework_id", "TEXT")
    _ensure_column(conn, "evidence_registry", "source_event_id", "INTEGER")
    _ensure_column(conn, "evidence_registry", "control_id", "TEXT")
    _ensure_column(conn, "evidence_registry", "evidence_type", "TEXT")
    _ensure_column(conn, "evidence_registry", "reference_id", "TEXT")
    _ensure_column(conn, "evidence_registry", "attestation", "TEXT")
    _ensure_column(conn, "evidence_registry", "review_status", "TEXT")
    _ensure_column(conn, "evidence_registry", "reviewed_by", "TEXT")
    _ensure_column(conn, "evidence_registry", "reviewed_at", "TEXT")
    _ensure_column(conn, "evidence_registry", "review_note", "TEXT")
    _ensure_column(conn, "evidence_registry", "created_at", "TEXT")

    # Seed zerotrust (safe)
    cur.execute(
        """
        INSERT OR IGNORE INTO zerotrust (company_id, enabled, roles, timeout)
        VALUES (?, ?, ?, ?)
        """,
        ("default", 1, "Admin,Operator", 15),
    )

    # Seed policy (safe)
    cur.execute(
        """
        INSERT OR IGNORE INTO zerotrust_policy (company_id, policy_json, updated_at)
        VALUES (?, ?, ?)
        """,
        ("default", "{}", _now_iso()),
    )

    conn.commit()
    conn.close()


# -------------------------
# Zero Trust Policy (what main.py reads)
# -------------------------

def get_zerotrust_policy(company_id: str = "default") -> Dict[str, Any]:
    conn = connect()
    cur = conn.cursor()
    cur.execute(
        "SELECT company_id, policy_json, updated_at FROM zerotrust_policy WHERE company_id=?",
        (company_id,),
    )
    row = cur.fetchone()
    if not row:
        cur.execute(
            "INSERT INTO zerotrust_policy (company_id, policy_json, updated_at) VALUES (?, ?, ?)",
            (company_id, "{}", _now_iso()),
        )
        conn.commit()
        cur.execute(
            "SELECT company_id, policy_json, updated_at FROM zerotrust_policy WHERE company_id=?",
            (company_id,),
        )
        row = cur.fetchone()
    conn.close()
    return dict(row) if row else {"company_id": company_id, "policy_json": "{}", "updated_at": _now_iso()}


def set_zerotrust_policy(company_id: str, policy_json: str) -> None:
    conn = connect()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO zerotrust_policy (company_id, policy_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(company_id) DO UPDATE SET
            policy_json=excluded.policy_json,
            updated_at=excluded.updated_at
        """,
        (company_id, policy_json, _now_iso()),
    )
    conn.commit()
    conn.close()


# -------------------------
# Incidents (DB source of truth)
# -------------------------

def create_incident(
    *,
    incident_id: str,
    company_id: str,
    drone_id: Optional[str],
    threat_type: str,
    severity: str,
    title: str,
    training: bool = True,
    created_at: Optional[str] = None,
    details: Optional[str] = None,
    operator: Optional[str] = None,  # ✅ Option A (12E)
) -> Dict[str, Any]:
    ts = created_at or _now_iso()
    conn = connect()
    cur = conn.cursor()

    cols = _table_columns(conn, "incidents")
    has_operator = "operator" in cols

    if has_operator:
        cur.execute(
            """
            INSERT INTO incidents (
                incident_id, company_id, drone_id, threat_type, severity, title,
                status, training, created_at, updated_at, details, operator
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                incident_id,
                company_id,
                drone_id,
                threat_type,
                severity,
                title,
                "active",
                1 if training else 0,
                ts,
                ts,
                details,
                operator,
            ),
        )
    else:
        cur.execute(
            """
            INSERT INTO incidents (
                incident_id, company_id, drone_id, threat_type, severity, title,
                status, training, created_at, updated_at, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                incident_id,
                company_id,
                drone_id,
                threat_type,
                severity,
                title,
                "active",
                1 if training else 0,
                ts,
                ts,
                details,
            ),
        )

    conn.commit()
    cur.execute("SELECT * FROM incidents WHERE incident_id=?", (incident_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else {}


def get_incident(incident_id: str) -> Optional[Dict[str, Any]]:
    conn = connect()
    cur = conn.cursor()
    cur.execute("SELECT * FROM incidents WHERE incident_id=?", (incident_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def list_active_incidents(company_id: str, drone_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = connect()
    cur = conn.cursor()

    if drone_id:
        cur.execute(
            """
            SELECT * FROM incidents
            WHERE company_id=? AND status='active' AND drone_id=?
            ORDER BY created_at DESC
            """,
            (company_id, drone_id),
        )
    else:
        cur.execute(
            """
            SELECT * FROM incidents
            WHERE company_id=? AND status='active'
            ORDER BY created_at DESC
            """,
            (company_id,),
        )

    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_incident_status(
    *,
    incident_id: str,
    new_status: str,
    mitigated_action: Optional[str] = None,
    details: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    ts = _now_iso()
    conn = connect()
    cur = conn.cursor()

    # Build final values (only update what we intended; preserve existing values for others)
    existing = get_incident(incident_id) or {}
    final_status = new_status
    final_updated_at = ts
    final_details = details if details is not None else existing.get("details")
    final_mitigated_action = (
        mitigated_action if mitigated_action is not None else existing.get("mitigated_action")
    )
    final_mitigated_at = ts if new_status == "mitigated" else existing.get("mitigated_at")
    final_closed_at = ts if new_status == "closed" else existing.get("closed_at")

    cur.execute(
        """
        UPDATE incidents
        SET status=?,
            updated_at=?,
            details=?,
            mitigated_action=?,
            mitigated_at=?,
            closed_at=?
        WHERE incident_id=?
        """,
        (
            final_status,
            final_updated_at,
            final_details,
            final_mitigated_action,
            final_mitigated_at,
            final_closed_at,
            incident_id,
        ),
    )
    conn.commit()

    cur.execute("SELECT * FROM incidents WHERE incident_id=?", (incident_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def _operator_for_incident(conn: sqlite3.Connection, incident_id: str) -> Optional[str]:
    cols = _table_columns(conn, "incidents")
    if "operator" not in cols:
        return None
    cur = conn.cursor()
    cur.execute("SELECT operator FROM incidents WHERE incident_id=?", (incident_id,))
    r = cur.fetchone()
    if not r:
        return None
    return r["operator"]


def _latest_operator_for_drone(conn: sqlite3.Connection, company_id: str, drone_id: str) -> Optional[str]:
    cols = _table_columns(conn, "incidents")
    if "operator" not in cols:
        return None
    cur = conn.cursor()
    cur.execute(
        """
        SELECT operator FROM incidents
        WHERE company_id=? AND drone_id=? AND operator IS NOT NULL AND operator != ''
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (company_id, drone_id),
    )
    r = cur.fetchone()
    return r["operator"] if r else None


# -------------------------
# Forensics (audit backbone)
# -------------------------

def add_forensic_event(
    *,
    company_id: str,
    drone_id: Optional[str],
    incident_id: Optional[str],
    event_type: str,
    actor: Optional[str] = None,
    action: Optional[str] = None,
    result: Optional[str] = None,
    payload_json: Optional[str] = None,
    ts: Optional[str] = None,
) -> None:
    conn = connect()
    cur = conn.cursor()

    # ✅ Option A: auto-derive actor from operator when actor is missing
    derived_actor = actor
    if not derived_actor and incident_id:
        derived_actor = _operator_for_incident(conn, incident_id)
    if not derived_actor and drone_id:
        derived_actor = _latest_operator_for_drone(conn, company_id, drone_id)

    cur.execute(
        """
        INSERT INTO forensics_events (
            ts, company_id, drone_id, incident_id, event_type, actor, action, result, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ts or _now_iso(),
            company_id,
            drone_id,
            incident_id,
            event_type,
            derived_actor,
            action,
            result,
            payload_json,
        ),
    )
    source_event_id = cur.lastrowid
    conn.commit()

    mapping = CONTROL_EVENT_MAP.get(event_type)
    if mapping:
        framework_id, control_id = mapping
        # register_evidence opens its own connection.
        register_evidence(
            company_id=company_id,
            drone_id=drone_id,
            incident_id=incident_id,
            framework_id=framework_id,
            control_id=control_id,
            evidence_type=event_type,
            source_event_id=source_event_id,
            reference_id=incident_id or drone_id,
        )
    conn.close()


def list_forensics(
    *,
    company_id: str,
    drone_id: Optional[str] = None,
    incident_id: Optional[str] = None,
    limit: int = 500,
) -> List[Dict[str, Any]]:
    conn = connect()
    cur = conn.cursor()

    # Fixed SQL, no dynamic WHERE
    cur.execute(
        """
        SELECT * FROM forensics_events
        WHERE company_id=?
          AND (? IS NULL OR ? = '' OR drone_id=?)
          AND (? IS NULL OR ? = '' OR incident_id=?)
        ORDER BY ts ASC
        LIMIT ?
        """,
        (
            company_id,
            drone_id,
            drone_id,
            drone_id,
            incident_id,
            incident_id,
            incident_id,
            limit,
        ),
    )
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


CONTROL_EVENT_MAP = {
    "operator_assigned": ("faa_107", "107.12"),
    "incident_closed": ("faa_107", "107.21"),
    "mitigation_action_executed": ("faa_107", "107.49"),
}


def register_evidence(
    *,
    company_id: str,
    drone_id: Optional[str],
    incident_id: Optional[str],
    framework_id: str,
    control_id: str,
    evidence_type: str,
    source_event_id: Optional[int] = None,
    reference_id: Optional[str] = None,
) -> None:
    conn = connect()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO evidence_registry
        (company_id, drone_id, incident_id, framework_id, control_id, evidence_type, source_event_id, reference_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            company_id,
            drone_id,
            incident_id,
            framework_id,
            control_id,
            evidence_type,
            source_event_id,
            reference_id,
            _now_iso(),
        ),
    )
    conn.commit()
    conn.close()


def create_evidence(
    *,
    company_id: str,
    drone_id: Optional[str],
    incident_id: Optional[str],
    framework_id: str,
    control_id: str,
    evidence_type: str,
    source_event_id: Optional[int] = None,
    reference_id: Optional[str] = None,
    attestation: Optional[str] = None,
) -> Dict[str, Any]:
    conn = connect()
    cur = conn.cursor()

    created_at = _now_iso()
    cur.execute(
        """
        INSERT INTO evidence_registry
        (company_id, drone_id, incident_id, framework_id, control_id, evidence_type, source_event_id, reference_id, attestation, review_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            company_id,
            drone_id,
            incident_id,
            framework_id,
            control_id,
            evidence_type,
            source_event_id,
            reference_id,
            attestation,
            "pending",
            created_at,
        ),
    )
    new_id = cur.lastrowid
    conn.commit()

    row = cur.execute(
        "SELECT * FROM evidence_registry WHERE id=?",
        (new_id,),
    ).fetchone()

    conn.close()
    return dict(row) if row else {
        "id": new_id,
        "company_id": company_id,
        "drone_id": drone_id,
        "incident_id": incident_id,
        "framework_id": framework_id,
        "control_id": control_id,
        "evidence_type": evidence_type,
        "source_event_id": source_event_id,
        "reference_id": reference_id,
        "attestation": attestation,
        "review_status": "pending",
        "created_at": created_at,
    }


def review_evidence(
    *,
    company_id: str,
    evidence_id: int,
    review_status: str,
    reviewed_by: str,
    review_note: Optional[str] = None,
) -> Dict[str, Any]:
    conn = connect()
    cur = conn.cursor()
    reviewed_at = _now_iso()

    cur.execute(
        """
        UPDATE evidence_registry
        SET review_status=?,
            reviewed_by=?,
            reviewed_at=?,
            review_note=?
        WHERE id=? AND company_id=?
        """,
        (review_status, reviewed_by, reviewed_at, review_note, evidence_id, company_id),
    )
    conn.commit()

    row = cur.execute(
        "SELECT * FROM evidence_registry WHERE id=? AND company_id=?",
        (evidence_id, company_id),
    ).fetchone()
    conn.close()

    if not row:
        return {}
    return dict(row)


def list_evidence(
    *,
    company_id: str,
    framework_id: Optional[str] = None,
    control_id: Optional[str] = None,
    drone_id: Optional[str] = None,
    incident_id: Optional[str] = None,
    date_from: Optional[str] = None,  # YYYY-MM-DD
    date_to: Optional[str] = None,    # YYYY-MM-DD
    limit: int = 200,
) -> List[Dict[str, Any]]:
    conn = connect()
    cur = conn.cursor()

    where = ["company_id = ?"]
    params: List[Any] = [company_id]

    if framework_id:
        where.append("framework_id = ?")
        params.append(framework_id)

    if control_id:
        where.append("control_id = ?")
        params.append(control_id)

    if drone_id:
        # In drone-scoped view, include both drone-specific AND org-level evidence
        where.append("(drone_id = ? OR drone_id IS NULL)")
        params.append(drone_id)

    if incident_id:
        where.append("incident_id = ?")
        params.append(incident_id)

    if date_from:
        where.append("created_at >= ?")
        params.append(_day_bounds_utc(date_from, end=False))

    if date_to:
        where.append("created_at <= ?")
        params.append(_day_bounds_utc(date_to, end=True))

    params.append(limit)

    sql = f"""
        SELECT *
        FROM evidence_registry
        WHERE {' AND '.join(where)}
        ORDER BY created_at DESC
        LIMIT ?
    """

    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def evidence_summary_by_control(
    *,
    company_id: str,
    framework_id: str,
    drone_id: Optional[str] = None,
    date_from: Optional[str] = None,  # YYYY-MM-DD
    date_to: Optional[str] = None,    # YYYY-MM-DD
) -> List[Dict[str, Any]]:
    """
    Returns one row per control_id with counts broken down by review_status.

    review_status values expected: 'accepted' | 'pending' | 'rejected'
    If review_status is NULL/empty (older rows), we treat it as 'pending' for v1.
    """
    conn = connect()
    cur = conn.cursor()

    where = ["company_id = ?", "framework_id = ?"]
    params: List[Any] = [company_id, framework_id]

    # Drone scope rule: include drone-specific AND org-level (NULL) evidence
    if drone_id:
        where.append("(drone_id = ? OR drone_id IS NULL)")
        params.append(drone_id)

    if date_from:
        where.append("created_at >= ?")
        params.append(_day_bounds_utc(date_from, end=False))
    if date_to:
        where.append("created_at <= ?")
        params.append(_day_bounds_utc(date_to, end=True))

    sql = f"""
        SELECT
            control_id,
            SUM(CASE WHEN COALESCE(NULLIF(review_status, ''), 'pending') = 'accepted' THEN 1 ELSE 0 END) AS accepted,
            SUM(CASE WHEN COALESCE(NULLIF(review_status, ''), 'pending') = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN COALESCE(NULLIF(review_status, ''), 'pending') = 'rejected' THEN 1 ELSE 0 END) AS rejected,
            COUNT(*) AS total
        FROM evidence_registry
        WHERE {' AND '.join(where)}
        GROUP BY control_id
    """

    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]
