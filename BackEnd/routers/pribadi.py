# BackEnd/routers/pribadi.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from BackEnd.database import get_db
from BackEnd.models import Pribadi
from .auth import get_current_user

from .utils import is_div_head_of_division, is_hrd_head, is_hrd_staff

router = APIRouter()

class PribadiRequest(BaseModel):
    title: str
    requestType: str
    date: str | None = None
    shortHour: str | None = None
    comeLateDate: str | None = None
    comeLateHour: str | None = None
    tempLeaveStart: str | None = None
    tempLeaveEnd: str | None = None

def parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except:
        return None

def parse_time(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%H:%M").time()
    except:
        return None

@router.post("/")
async def create_private(data: PribadiRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    entry = Pribadi(
        name=current_user.name,
        title=data.title,
        division=current_user.division,
        request_type=data.requestType,
        day_label=data.date,
        date=parse_date(data.date),
        short_hour=parse_time(data.shortHour),
        come_late_day=data.comeLateDate,
        come_late_date=parse_date(data.comeLateDate),
        come_late_hour=parse_time(data.comeLateHour),
        temp_leave_start=parse_date(data.tempLeaveStart),
        temp_leave_end=parse_date(data.tempLeaveEnd),
        approval_status="pending"
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Private request saved", "id": entry.id}

@router.get("/my")
async def get_my_private(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Pribadi).filter(Pribadi.name == current_user.name).all()

@router.get("/all")
async def get_all_private(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    return db.query(Pribadi).all()

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
            db.query(Pribadi)   # ← replace Pribadi per file
            .order_by(Pribadi.created_at.desc())
            .all()
        )

    # ✅ DIV HEAD sees own division
    if role == "div_head":
        return (
            db.query(Pribadi)
            .filter(Pribadi.division == division)
            .order_by(Pribadi.created_at.desc())
            .all()
        )

    # ✅ STAFF sees own only
    return (
        db.query(Pribadi)
        .filter(Pribadi.name == current_user.name)
        .order_by(Pribadi.created_at.desc())
        .all()
    )


@router.put("/{id}/div-head-approve")
def approve_private(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if not (
        is_div_head_of_division(current_user, Pribadi.division)
        or is_hrd_head(current_user)
    ):
        raise HTTPException(403, "Not allowed")

    if req.approval_div_head is not None:
        raise HTTPException(400, "Already processed")

    req.approval_div_head = "approved"
    req.approval_status = "approved"     # 🔥 FIX
    req.approved_by = current_user.name

    db.commit()
    db.refresh(req)
    return req

@router.put("/{id}/hrd-approve")
def hrd_approve_private(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not is_hrd_head(current_user):
        raise HTTPException(403, "HRD head only")

    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for div head")

    req.approval_hrd = "approved"
    req.approval_status = "approved"
    req.approved_by = current_user.name

    db.commit()
    return req

@router.put("/{id}/div-head-deny")
def deny_private(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not (
        is_div_head_of_division(current_user, Pribadi.division)
        or is_hrd_head(current_user)
    ):
        raise HTTPException(403, "Not allowed")
    req.approval_div_head = "rejected"
    req.approval_status = "rejected"
    req.approved_by = current_user.name

    db.commit()
    return req

@router.put("/{id}/approve")
async def approve_private_admin(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for division head approval")

    req.approval_admin = "approved"
    req.approval_status = "approved"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "admin approved"}

@router.put("/{id}/deny")
async def deny_private(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if (
        is_div_head_of_division(current_user, req.division)
        or is_hrd_head(current_user)
        or current_user.role == "admin"
    ):
        req.approval_status = "denied"
        req.approved_by = current_user.name
        db.commit()
        return {"message": "denied"}
    raise HTTPException(403, "Not authorized to deny")
