# BackEnd/routers/dinas.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dinas
from pydantic import BaseModel

router = APIRouter()


class DinasRequest(BaseModel):
    name: str
    division: str
    purpose: str
    timeStart: str
    timeEnd: str
    status: str


# -------------------------------
# POST (staff submit)
# -------------------------------
@router.post("/")
async def create_dinas_request(data: DinasRequest, db: Session = Depends(get_db)):
    entry = Dinas(
        name=data.name,
        division=data.division,
        purpose=data.purpose,
        time_start=data.timeStart,
        time_end=data.timeEnd,
        status=data.status,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Dinas request saved", "id": entry.id}


# -------------------------------
# GET ALL (admin)
# -------------------------------
@router.get("/")
async def get_all_dinas(x_role: str = Header("staff"), db: Session = Depends(get_db)):
    if x_role != "admin":
        raise HTTPException(403, "Admin only")
    return db.query(Dinas).all()


# -------------------------------
# GET STAFF REQUESTS (name-based)
# -------------------------------
@router.get("/{name}")
async def get_user_dinas(
    name: str, x_role: str = Header("staff"), db: Session = Depends(get_db)
):
    if x_role != "staff":
        raise HTTPException(403, "Staff only")
    return db.query(Dinas).filter(Dinas.name == name).all()


# -------------------------------
# PUT approve
# -------------------------------
@router.put("/{id}/approve")
async def approve_dinas(id: int, x_role: str = Header("staff"), db: Session = Depends(get_db)):
    if x_role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Dinas).filter(Dinas.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    req.approval_status = "approved"
    db.commit()
    return {"message": "approved"}


# -------------------------------
# PUT deny
# -------------------------------
@router.put("/{id}/deny")
async def deny_dinas(id: int, x_role: str = Header("staff"), db: Session = Depends(get_db)):
    if x_role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Dinas).filter(Dinas.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    req.approval_status = "denied"
    db.commit()
    return {"message": "denied"}
