from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from BackEnd.database import get_db
from BackEnd.models import User
from .firebase_auth.firebase_auth import verify_firebase_token

router = APIRouter()


# -------------------------------
# /auth/me  -> return logged-in user
# -------------------------------
@router.get("/me")
def auth_me(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    print("AUTH HEADER:", authorization)
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    # Must start with Bearer token
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format")

    token = authorization.split(" ")[1]
    decoded = verify_firebase_token(token)

    email = decoded.get("email")
    if not email:
        raise HTTPException(400, "Firebase token missing email")

    # Lookup user in PostgreSQL
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, f"User {email} not found in database")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }


# -------------------------------
# Dependency for protected routes
# -------------------------------
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
    name = decoded.get("name", email.split("@")[0])

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto-create user
        user = User(name=name, email=email, role="staff")
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


# -------------------------------
# Only admin
# -------------------------------
def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    return user
