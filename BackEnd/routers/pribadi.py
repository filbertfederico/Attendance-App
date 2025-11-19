# routers/pribadi.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from BackEnd.database import get_db
from BackEnd.models import Pribadi
from .auth import get_current_user

router = APIRouter()

# ---------------------------
# Pydantic model
# ---------------------------
class PribadiRequest(BaseModel):
    name: str
    title: str
    requestType: str

    date: str | None = None
    shortHour: str | None = None

    comeLateDate: str | None = None
    comeLateHour: str | None = None

    tempLeaveDay: str | None = None
    tempLeaveDate: str | None = None


# ---------------------------
# Parsing helpers
# ---------------------------
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


# ---------------------------
# CREATE PRIVATE REQUEST
# ---------------------------
@router.post("/")
async def create_private(
    data: PribadiRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    entry = Pribadi(
        name=data.name,
        title=data.title,
        request_type=data.requestType,

        dayLabel=data.date,
        date=parse_date(data.date),

        short_hour=parse_time(data.shortHour),

        come_late_day=data.comeLateDate,
        come_late_date=parse_date(data.comeLateDate),
        come_late_hour=parse_time(data.comeLateHour),

        temp_leave_day=data.tempLeaveDay,
        temp_leave_date=parse_date(data.tempLeaveDate),

        approval_status="pending"
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Private request saved", "id": entry.id}


# ---------------------------
# STAFF: GET MY REQUESTS
# ---------------------------
@router.get("/my")
async def get_my_private(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Filter by name (your table uses names)
    user_name = current_user.name

    result = db.query(Pribadi).filter(Pribadi.name == user_name).all()
    return result


# ---------------------------
# ADMIN: GET ALL
# ---------------------------
@router.get("/")
async def get_all_private(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(Pribadi).all()


# ---------------------------
# ADMIN: APPROVE
# ---------------------------
@router.put("/{id}/approve")
async def approve_private(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.approval_status = "approved"
    req.approved_by = current_user.name  # FIX
    db.commit()

    return {"message": "approved"}


# ---------------------------
# ADMIN: DENY
# ---------------------------
@router.put("/{id}/deny")
async def deny_private(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.approval_status = "denied"
    req.approved_by = current_user.name  # FIX
    db.commit()

    return {"message": "denied"}
