from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from BackEnd.models import Cuti
from BackEnd.database import get_db
from .auth import get_current_user
from .utils import get_div_head_role

router = APIRouter()

# ----------------------
# CREATE CUTI REQUEST
# ----------------------
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

        purpose=data["purpose"],
        address=data["address"],
        phone=data["phone"],
        notes=data["notes"],

        leave_days=data["leave_days"],
        leave_remaining=data["leave_remaining"],
        approval_status="pending"
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Cuti submitted", "id": entry.id}


# ----------------------
# STAFF VIEW OWN REQUESTS
# ----------------------
@router.get("/my")
def my_cuti(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Cuti)
        .filter(Cuti.name == current_user.name)
        .all()
    )


# ----------------------
# DIV HEAD VIEW
# ----------------------
@router.get("/by-division")
def div_head_list(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.division.startswith("DIV_HEAD_"):
        raise HTTPException(403, "Division head only")

    staff_div = current_user.division.replace("DIV_HEAD_", "")

    return (
        db.query(Cuti)
        .filter(Cuti.division == staff_div)
        .filter(Cuti.approval_div_head.is_(None))
        .all()
    )


# ----------------------
# DIV HEAD APPROVE/DENY
# ----------------------
@router.put("/{id}/div-head-approve")
def div_head_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()
    if not req:
        raise HTTPException(404)

    required = get_div_head_role(req.division)
    if current_user.division != required:
        raise HTTPException(403)

    req.approval_div_head = "approved"
    db.commit()
    return {"message": "Division head approved"}


@router.put("/{id}/div-head-deny")
def div_head_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()
    if not req:
        raise HTTPException(404)

    required = get_div_head_role(req.division)
    if current_user.division != required:
        raise HTTPException(403)

    req.approval_div_head = "rejected"
    req.approval_status = "rejected"
    db.commit()
    return {"message": "Division head denied"}


# ----------------------
# HRD APPROVAL
# ----------------------
@router.put("/{id}/hrd-approve")
def hrd_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()
    if not req:
        raise HTTPException(404)

    if current_user.division != "DIV_HEAD_HRD":
        raise HTTPException(403, "Only HRD head can approve")

    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for division head approval")

    req.approval_hrd = "approved"
    req.approval_status = "approved"
    db.commit()
    return {"message": "HRD approved"}


@router.put("/{id}/hrd-deny")
def hrd_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Cuti).filter(Cuti.id == id).first()
    if not req:
        raise HTTPException(404)

    if current_user.division != "DIV_HEAD_HRD":
        raise HTTPException(403)

    req.approval_hrd = "rejected"
    req.approval_status = "rejected"
    db.commit()
    return {"message": "HRD denied"}
