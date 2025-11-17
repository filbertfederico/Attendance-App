# BackEnd/routers/pribadi.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Pribadi
from pydantic import BaseModel

router = APIRouter()


class PribadiRequest(BaseModel):
    name: str
    title: str
    requestType: str
    date: str | None = None
    shortHour: str | None = None
    comeLateDate: str | None = None
    comeLateHour: str | None = None


# -------------------------------
# POST (staff submit)
# -------------------------------
@router.post("/")
async def create_private(data: PribadiRequest, db: Session = Depends(get_db)):
    entry = Pribadi(
        name=data.name,
        title=data.title,
        request_type=data.requestType,
        date=data.date,
        short_hour=data.shortHour,
        come_late_date=data.comeLateDate,
        come_late_hour=data.comeLateHour,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Private request saved", "id": entry.id}


# -------------------------------
# GET ALL (admin)
# -------------------------------
@router.get("/")
async def all_private(x_role: str = Header("staff"), db: Session = Depends(get_db)):
    if x_role != "admin":
        raise HTTPException(403, "Admin only")
    return db.query(Pribadi).all()


# -------------------------------
# GET STAFF REQUESTS (name-based)
# -------------------------------
@router.get("/{name}")
async def my_private(name: str, x_role: str = Header("staff"), db: Session = Depends(get_db)):
    if x_role != "staff":
        raise HTTPException(403, "Staff only")
    return db.query(Pribadi).filter(Pribadi.name == name).all()


# -------------------------------
# PUT approve
# -------------------------------
@router.put("/{id}/approve")
async def approve_private(id: int, x_role: str = Header("staff"), db: Session = Depends(get_db)):
    if x_role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    req.approval_status = "approved"
    db.commit()
    return {"message": "approved"}


# -------------------------------
# PUT deny
# -------------------------------
@router.put("/{id}/deny")
async def deny_private(id: int, x_role: str = Header("staff"), db: Session = Depends(get_db)):
    if x_role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    req.approval_status = "denied"
    db.commit()
    return {"message": "denied"}
