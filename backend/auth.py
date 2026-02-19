from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
import jwt

# =========================================================
# CONFIG (DEV MODE)
# =========================================================

JWT_SECRET = "DEV_ONLY_CHANGE_ME"
JWT_ALG = "HS256"
TOKEN_TTL_HOURS = 8

# Hardcoded users (DEV ONLY)
USERS = {
    "admin": {
        "password": "admin",
        "role": "Admin",
        "company_id": "default",
    },
    "operator1": {
        "password": "operator1",
        "role": "Operator",
        "company_id": "default",
    }
}

# =========================================================
# ROUTER + SECURITY
# =========================================================

router = APIRouter(prefix="/auth", tags=["auth"])

# THIS creates the simple "Bearer <token>" Authorize box
bearer_scheme = HTTPBearer()

# =========================================================
# MODELS
# =========================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    expires_at: str


# =========================================================
# JWT HELPERS
# =========================================================

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _make_token(username: str, role: str, company_id: str) -> Dict[str, Any]:
    exp = _now() + timedelta(hours=TOKEN_TTL_HOURS)
    payload = {
        "sub": username,
        "role": role,
        "company_id": company_id,
        "exp": exp,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    return {"token": token, "exp": exp}


def _decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# =========================================================
# AUTH ENDPOINTS
# =========================================================

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = USERS.get(req.username)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token_data = _make_token(
        username=req.username,
        role=user["role"],
        company_id=user["company_id"],
    )

    expires = token_data["exp"]

    return LoginResponse(
        access_token=token_data["token"],
        role=user["role"],
        expires_at=expires.isoformat().replace("+00:00", "Z"),
    )


# =========================================================
# DEPENDENCIES (USED BY PROTECTED ROUTES)
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> Dict[str, Any]:
    token = credentials.credentials
    payload = _decode_token(token)

    return {
        "username": payload.get("sub"),
        "role": payload.get("role"),
        "company_id": payload.get("company_id"),
    }


def require_token(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return user


def require_role(required_role: str):
    def _checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user.get("role") != required_role:
            raise HTTPException(status_code=403, detail="Not authorized")
        return user
    return _checker
