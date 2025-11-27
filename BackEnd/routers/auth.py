# BackEnd/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from BackEnd.database import get_db
from BackEnd.models import User
from .firebase_auth.firebase_auth import verify_firebase_token

router = APIRouter()


# ===========================================
# /auth/me - returns logged-in user info
# ===========================================
@router.get("/me")
def auth_me(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Invalid Authorization format")

    token = authorization.split(" ")[1]
    decoded = verify_firebase_token(token)

    email = decoded.get("email")
    if not email:
        raise HTTPException(400, "Firebase token missing email")

    # Find user in DB
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, f"User {email} not found in database")

    # 🔥 Ensure division always exists
    if not hasattr(user, "division"):
        division = "GENERAL"
    else:
        division = user.division or "GENERAL"

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "division": division
    }


# ===========================================
# get_current_user - for protected endpoints
# ===========================================
def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Invalid Authorization format")

    token = authorization.split(" ")[1]
    decoded = verify_firebase_token(token)

    email = decoded["email"]
    fallback_name = email.split("@")[0]
    name = decoded.get("name", fallback_name)

    # Look up user
    user = db.query(User).filter(User.email == email).first()

    # Auto-create if not found
    if not user:
        user = User(
            name=name,
            email=email,
            role="staff",
            division="GENERAL"   # 🔥 default division
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 🔥 Guarantee division exists
    if not getattr(user, "division", None):
        user.division = "GENERAL"
        db.commit()

    return user


# ===========================================
# Only admin
# ===========================================
def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    return user
