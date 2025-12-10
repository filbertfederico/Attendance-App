# BackEnd/routers/pribadi.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from BackEnd.database import get_db
from BackEnd.models import Pribadi
from .auth import get_current_user

from .utils import is_div_head_of_division, is_hrd_head

router = APIRouter()

class PribadiRequest(BaseModel):
    name: str
    title: str
    requestType: str
    division: str
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
        name=data.name,
        title=data.title,
        division=data.division,
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
def get_private_by_division(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "div_head":
        raise HTTPException(403, "Division head only")
    
    # HRD & GA gets to see all
    if is_hrd_head(current_user):
        return db.query(Pribadi).order_by(Pribadi.created_at.desc()).all()

    return db.query(Pribadi)\
        .filter(Pribadi.division == current_user.division)\
        .order_by(Pribadi.created_at.desc())\
        .all()

@router.put("/{id}/div-head-approve")
def approve_private(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403, "Not authorized to approve this")

    req.approval_div_head = "approved"
    db.commit()
    return {"message": "Division head approved"}

@router.put("/{id}/div-head-deny")
def deny_private(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403, "Not authorized")

    req.approval_status = "rejected"
    req.approval_div_head = "rejected"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "Division head denied"}

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
