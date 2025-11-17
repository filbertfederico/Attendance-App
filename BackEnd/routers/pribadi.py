from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Pribadi
from pydantic import BaseModel
from datetime import datetime, date, time

router = APIRouter()
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


def parse_date(value):
    try:
        if value:
            return datetime.strptime(value, "%Y-%m-%d").date()
    except:
        return None
    return None

def parse_time(value):
    try:
        if value:
            return datetime.strptime(value, "%H:%M").time()
    except:
        return None
    return None


@router.post("/")
async def create_private(data: PribadiRequest, db: Session = Depends(get_db)):

    entry = Pribadi(
        name=data.name,
        title=data.title,
        request_type=data.requestType,

        # cuti
        dayLabel=data.date,
        date=parse_date(data.date),
        # plg cepat
        short_hour=parse_time(data.shortHour),
        # telat
        come_late_day=data.comeLateDate,
        come_late_date=parse_date(data.comeLateDate),
        come_late_hour=parse_time(data.comeLateHour),
        # izin sementara
        temp_leave_day=data.tempLeaveDay,
        temp_leave_date=parse_date(data.tempLeaveDate)
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Private request saved", "id": entry.id}




# -----------------------
# GET /private/my?name=xxx
# -----------------------
@router.get("/my")
async def my_private(name: str, db: Session = Depends(get_db)):
    print("DEBUG: /private/my called with name =", name)
    try:
        result = db.query(Pribadi).filter(Pribadi.name == name).all()
        print("DEBUG: Query result =", result)
        return result
    except Exception as e:
        print("ERROR in /private/my:", e)
        raise HTTPException(500, str(e))


# -----------------------
# GET /private/
# -----------------------
@router.get("/")
async def all_private(db: Session = Depends(get_db)):
    return db.query(Pribadi).all()


# -----------------------
# PUT /private/{id}/approve
# -----------------------
@router.put("/{id}/approve")
async def approve(id: int, db: Session = Depends(get_db)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.approval_status = "approved"
    db.commit()
    return {"message": "approved"}


# -----------------------
# PUT /private/{id}/deny
# -----------------------
@router.put("/{id}/deny")
async def deny(id: int, db: Session = Depends(get_db)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.approval_status = "denied"
    db.commit()
    return {"message": "denied"}
