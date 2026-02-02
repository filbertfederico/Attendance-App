# BackEnd/routers/cuti.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from BackEnd.database import get_db
from BackEnd.models import Cuti, User
from BackEnd.routers.auth import get_current_user
from .utils import is_div_head_of_division, is_hrd_head, is_hrd_staff

router = APIRouter()

def parse_int_or_none(value):
    if value is None:
        return None
    if value == "":
        return None
    try:
        return int(value)
    except:
        return None

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
        leave_remaining=parse_int_or_none(data.get("leave_remaining", 0)),

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
def get_by_division(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = (current_user.role or "").lower()
    division = (current_user.division or "").upper()

    # ✅ HRD (STAFF + DIV HEAD) SEE EVERYTHING
    if is_hrd_head(current_user) or is_hrd_staff(current_user):
        return (
            db.query(Cuti)   # ← replace Cuti per file
            .order_by(Cuti.created_at.desc())
            .all()
        )

    # ✅ DIV HEAD sees own division
    if role == "div_head":
        return (
            db.query(Cuti)
            .filter(Cuti.division == division)
            .order_by(Cuti.created_at.desc())
            .all()
        )

    # ✅ STAFF sees own only
    return (
        db.query(Cuti)
        .filter(Cuti.name == current_user.name)
        .order_by(Cuti.created_at.desc())
        .all()
    )

# ---------------------------------------------------------
# DIVISION HEAD APPROVAL
# ---------------------------------------------------------
@router.put("/{id}/div-head-approve")
def div_head_approve(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    req = db.query(Cuti).get(id)
    if not req:
        raise HTTPException(404)

    if not is_div_head_of_division(user, req.division):
        raise HTTPException(403)

    if req.approval_div_head is not None:
        raise HTTPException(400)

    req.approval_div_head = "approved"
    db.commit()
    return req

@router.put("/{cuti_id}/div-head-deny")
def div_head_deny(cuti_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):

    form = db.query(Cuti).filter(Cuti.id == cuti_id).first()
    if not form:
        raise HTTPException(404, "Not found")

    if current_user.role != "div_head":
        raise HTTPException(403, "You are not division head")

    if not is_hrd_head(current_user) and current_user.division.upper() != form.division.upper():
        raise HTTPException(403, "Not your division")

    form.approval_div_head = "rejected"
    form.approval_status = "rejected"
    form.approved_by = current_user.name

    db.commit()
    return form



# ---------------------------------------------------------
# HRD APPROVAL
# ---------------------------------------------------------
@router.put("/{id}/hrd-approve")
def hrd_approve(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    req = db.query(Cuti).get(id)
    if not req:
        raise HTTPException(404)

    if user.role != "div_head" or user.division != "HRD & GA":
        raise HTTPException(403)

    if req.approval_div_head != "approved":
        raise HTTPException(400, "Waiting Div Head")

    req.approval_hrd = "approved"
    req.approval_status = "approved"  # ✅ FINAL
    db.commit()
    return req

@router.put("/{cuti_id}/hrd-deny")
def hrd_deny(cuti_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):

    if not is_hrd_head(current_user):
        raise HTTPException(403, "Only HRD head can deny")

    form = db.query(Cuti).filter(Cuti.id == cuti_id).first()
    if not form:
        raise HTTPException(404, "Not found")

    form.approval_hrd = "rejected"
    form.approval_status = "rejected"
    form.approved_by = current_user.name

    db.commit()
    return form



# ---------------------------------------------------------
# ADMIN GET ALL
# ---------------------------------------------------------
@router.get("/all")
def admin_all(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(Cuti).order_by(Cuti.created_at.desc()).all()