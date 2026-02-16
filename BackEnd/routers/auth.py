# BackEnd/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func

from BackEnd.database import get_db
from BackEnd.models import User
from .firebase_auth.firebase_auth import verify_firebase_token

router = APIRouter()

# ============================================================
# Helper — get user by email (CASE-INSENSITIVE)
# ============================================================
def get_user_by_email(db: Session, email: str):
    normalized = email.strip().lower()
    return db.query(User).filter(func.lower(User.email) == normalized).first()


# ============================================================
# /auth/me — FRONTEND uses this to detect role/division
# ============================================================
@router.get("/me")
def auth_me(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Authorization must start with 'Bearer'")

    token = authorization.split(" ")[1]
    decoded = verify_firebase_token(token)

    email = decoded.get("email")
    if not email:
        raise HTTPException(400, "Token missing email")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(404, f"User {email} is not registered in database.")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "division": user.division or "GENERAL"
    }


# ============================================================
# get_current_user — used inside ALL protected routes
# ============================================================
def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Authorization must start with 'Bearer'")

    token = authorization.split(" ")[1]
    decoded = verify_firebase_token(token)

    email = decoded.get("email")
    if not email:
        raise HTTPException(400, "Token missing email")

    # Firebase may not include name — fallback to email prefix
    fallback_name = email.split("@")[0]
    name = decoded.get("name", fallback_name)

    # Ensure case-insensitive lookup
    user = get_user_by_email(db, email)

    # DO NOT AUTO-CREATE USERS ANYMORE
    if not user:
        raise HTTPException(
            403,
            "User is not registered in the system. Please contact the administrator."
        )

    # Sync name if Firebase displays updated name
    if user.name != name:
        user.name = name
        db.commit()

    # Ensure division exists
    if not user.division:
        user.division = "GENERAL"
        db.commit()

    return user


# ============================================================
# ADMIN PROTECTION — For admin-only routes
# ============================================================
def require_admin(current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user