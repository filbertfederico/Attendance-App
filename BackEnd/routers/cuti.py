# BackEnd/routers/cuti.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from BackEnd.models import Cuti
from BackEnd.database import get_db
from .auth import get_current_user

from .utils import is_div_head_of_division, is_hrd_head

router = APIRouter()

# -------------------------------------------------------
# CREATE CUTI REQUEST
# -------------------------------------------------------
@router.post("/")
def create_cuti(data: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    entry = Cuti(
        name=current_user.name,
        role=current_user.role,
        division=current_user.division,

        cuti_type=data["cuti_type"],
        date_start=datetime.strptime(data["date_start"], "%Y-%m-%d").date(),
        date_end=datetime.strptime(data["date_end"], "%Y-%m-%d").date(),
        duration=data["duration"],

        purpose=data.get("purpose"),
        address=data.get("address"),
        phone=data.get("phone"),
        notes=data.get("notes"),

        leave_days=data.get("leave_days"),
        leave_remaining=data.get("leave_remaining"),

        approval_status="pending"
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Cuti submitted", "id": entry.id}


# -------------------------------------------------------
# STAFF
# -------------------------------------------------------
@router.get("/my")
def my_cuti(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Cuti).filter(Cuti.name == current_user.name).all()

# -------------------------------------------------------
# ADMIN VIEW — All Requests
# -------------------------------------------------------
@router.get("/all")
def get_all_cuti(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    return db.query(Cuti).all()

# -------------------------------------------------------
# DIVISION HEAD VIEW — Only Same Division
# -------------------------------------------------------
@router.get("/by-division")
def div_head_view(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "div_head":
        raise HTTPException(403, "Division head only")

    return (
        db.query(Cuti)
        .filter(Cuti.division == current_user.division)
        .filter(Cuti.approval_status == "pending")
        .all()
    )

# -------------------------------------------------------
# DIVISION HEAD APPROVE
# -------------------------------------------------------
@router.put("/{id}/div-head-approve")
def cuti_div_head_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()

    if not req:
        raise HTTPException(404)

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403, "Not your division")

    req.approval_div_head = "approved"
    db.commit()

    return {"message": "Division head approved"}

# -------------------------------------------------------
# DIVISION HEAD DENY
# -------------------------------------------------------
@router.put("/{id}/div-head-deny")
def cuti_div_head_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()

    if not req:
        raise HTTPException(404)

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403)

    req.approval_div_head = "rejected"
    req.approval_status = "rejected"
    req.approved_by = current_user.name

    db.commit()
    return {"message": "Division head denied"}

# -------------------------------------------------------
# HRD FINAL APPROVAL
# -------------------------------------------------------
@router.put("/{id}/hrd-approve")
def cuti_hrd_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()

    if not req:
        raise HTTPException(404)

    if not is_hrd_head(current_user):
        raise HTTPException(403, "Only HRD division head can approve")

    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for division head approval")

    req.approval_hrd = "approved"
    req.approval_status = "approved" 
    req.approved_by = current_user.name

    db.commit()
    return {"message": "HRD approved (final)"}

# -------------------------------------------------------
# HRD DENY
# -------------------------------------------------------
@router.put("/{id}/hrd-deny")
def cuti_hrd_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()

    if not req:
        raise HTTPException(404)

    if not is_hrd_head(current_user):
        raise HTTPException(403)

    req.approval_status = "rejected"
    req.approved_by = current_user.name

    db.commit()
    return {"message": "HRD denied (final)"}
