# BackEnd/routers/cuti.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from BackEnd.database import get_db
from BackEnd.models import Cuti, User
from BackEnd.routers.auth import get_current_user

router = APIRouter()


# ---------------------------------------------------------
# Helper: Check if user is division head of target division
# ---------------------------------------------------------
def is_div_head_of_division(current_user: User, division: str):
    return current_user.role == "div_head" and current_user.division == division


# ---------------------------------------------------------
# CREATE CUTI REQUEST (Staff or Div Head)
# ---------------------------------------------------------
@router.post("/")
def create_cuti(data: dict, 
                current_user: User = Depends(get_current_user), 
                db: Session = Depends(get_db)):

    try:
        date_start = datetime.strptime(data["date_start"], "%Y-%m-%d").date()
        date_end = datetime.strptime(data["date_end"], "%Y-%m-%d").date()
    except:
        raise HTTPException(400, "Invalid date format")

    duration = (date_end - date_start).days + 1
    if duration < 1:
        raise HTTPException(400, "Invalid date range")

    entry = Cuti(
        name=current_user.name,
        role=current_user.role,
        division=current_user.division,

        cuti_type=data["cuti_type"],
        date_start=date_start,
        date_end=date_end,
        duration=duration,

        purpose=data.get("purpose"),
        address=data.get("address"),
        phone=data.get("phone"),
        notes=data.get("notes"),

        leave_days=data.get("leave_days", 0),
        leave_remaining=data.get("leave_remaining", 0),

        approval_status="pending",
        approval_div_head=None,
        approval_hrd=None,
        approved_by=None
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Cuti request submitted", "id": entry.id}


# ---------------------------------------------------------
# STAFF - GET MY CUTI REQUESTS
# ---------------------------------------------------------
@router.get("/my")
def get_my_cuti(current_user: User = Depends(get_current_user), 
                db: Session = Depends(get_db)):

    return db.query(Cuti)\
             .filter(Cuti.name == current_user.name)\
             .order_by(Cuti.created_at.desc())\
             .all()


# ---------------------------------------------------------
# DIV HEAD - GET REQUESTS BY DIVISION
# ---------------------------------------------------------
@router.get("/by-division")
def get_by_division(current_user: User = Depends(get_current_user), 
                    db: Session = Depends(get_db)):

    if current_user.role not in ["div_head", "admin"]:
        raise HTTPException(403, "Not authorized")

    if current_user.role == "div_head":
        return db.query(Cuti)\
        .filter(Cuti.division == current_user.division)\
        .order_by(Cuti.created_at.desc())\
        .all()
    # Admin fallback (should not be used)
    return db.query(Cuti).order_by(Cuti.created_at.desc()).all()


# ---------------------------------------------------------
# DIV HEAD APPROVAL
# ---------------------------------------------------------
@router.put("/{id}/div-head-approve")
def div_head_approve(id: int,
                     current_user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):

    entry = db.query(Cuti).filter(Cuti.id == id).first()
    if not entry:
        raise HTTPException(404, "Cuti request not found")

    if not is_div_head_of_division(current_user, entry.division):
        raise HTTPException(403, "You are not the division head for this division")

    if entry.name == current_user.name:
        raise HTTPException(403, "You cannot approve your own request")

    entry.approval_div_head = "approved"
    entry.approval_status = "pending_hrd"
    entry.approved_by = current_user.name

    db.commit()
    return {"message": "Div head approval completed"}


# ---------------------------------------------------------
# HRD APPROVAL (FINAL APPROVAL)
# ---------------------------------------------------------
@router.put("/{id}/hrd-approve")
def hrd_approve(id: int,
                current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):

    if current_user.division != "HRD & GA":
        raise HTTPException(403, "Only HRD can approve this form")

    entry = db.query(Cuti).filter(Cuti.id == id).first()
    if not entry:
        raise HTTPException(404, "Cuti request not found")

    if entry.name == current_user.name:
        raise HTTPException(403, "You cannot approve your own request")

    entry.approval_hrd = "approved"
    entry.approval_status = "approved"
    entry.approved_by = current_user.name

    db.commit()
    return {"message": "Cuti request fully approved by HRD"}


# ---------------------------------------------------------
# ADMIN - VIEW ALL CUTI
# ---------------------------------------------------------
@router.get("/all")
def admin_get_all(current_user: User = Depends(get_current_user), 
                  db: Session = Depends(get_db)):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(Cuti).order_by(Cuti.created_at.desc()).all()
