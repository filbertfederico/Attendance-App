# BackEnd/routers/cuti.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from BackEnd.database import get_db
from BackEnd.models import Cuti, User
from BackEnd.routers.auth import get_current_user
from .utils import is_div_head_of_division, is_hrd_head

router = APIRouter()

# ---------------------------------------------------------
# CREATE CUTI REQUEST
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
    return {"message": "Cuti submitted", "id": entry.id}


# ---------------------------------------------------------
# GET MY CUTI
# ---------------------------------------------------------
@router.get("/my")
def get_my_cuti(current_user: User = Depends(get_current_user), 
                db: Session = Depends(get_db)):

    return db.query(Cuti)\
        .filter(Cuti.name == current_user.name)\
        .order_by(Cuti.created_at.desc())\
        .all()


# ---------------------------------------------------------
# GET CUTI BY DIVISION (DIV HEAD)
# ---------------------------------------------------------
@router.get("/by-division")
def get_by_division(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role not in ["div_head", "admin"]:
        raise HTTPException(403, "Division head only")

    return db.query(Cuti)\
        .filter(Cuti.division == current_user.division)\
        .order_by(Cuti.created_at.desc())\
        .all()


# ---------------------------------------------------------
# DIVISION HEAD APPROVAL
# ---------------------------------------------------------
@router.put("/{id}/div-head-approve")
def div_head_approve(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    entry = db.query(Cuti).filter(Cuti.id == id).first()
    if not entry:
        raise HTTPException(404, "Not found")

    # Not allowed to approve own form
    if entry.name == current_user.name:
        raise HTTPException(403, "You cannot approve your own request")

    # Must be head of the correct division
    if not is_div_head_of_division(current_user, entry.division):
        raise HTTPException(403, "Not authorized")

    # 🔥 SPECIAL CASE: HRD & GA HEAD
    if is_hrd_head(current_user):
        entry.approval_div_head = "approved"
        entry.approval_hrd = "approved"
        entry.approval_status = "approved"
        entry.approved_by = current_user.name

    else:
        # Normal division head
        entry.approval_div_head = "approved"
        entry.approval_status = "pending_hrd"
        entry.approved_by = current_user.name

    db.commit()
    return {"message": "Division head approval completed"}


# ---------------------------------------------------------
# HRD FINAL APPROVAL (Only if NOT HRD div head)
# ---------------------------------------------------------
def hrd_approve(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    if not is_hrd_head(current_user):
        raise HTTPException(403, "HRD only")

    entry = db.query(Cuti).filter(Cuti.id == id).first()
    if not entry:
        raise HTTPException(404, "Not found")

    entry.approval_hrd = "approved"
    entry.approval_status = "approved"
    entry.approved_by = current_user.name

    db.commit()
    return {"message": "Cuti approved by HRD"}


# ---------------------------------------------------------
# ADMIN GET ALL
# ---------------------------------------------------------
@router.get("/all")
def admin_all(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(Cuti).order_by(Cuti.created_at.desc()).all()