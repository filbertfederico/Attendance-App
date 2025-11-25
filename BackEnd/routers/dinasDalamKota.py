# routers/dinasdalamkota.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasDalamKota
from BackEnd.database import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/dinasDalamKota",
    tags=["Dinas Dalam Kota"]
)

# ---------------------
# Pydantic Request Model
# ---------------------
class DinasDalamKotaRequest(BaseModel):
    name: str
    division: str
    purpose: str
    timeStart: str
    timeEnd: str
    status: str


# ---------------------
# CREATE
# POST /dinasDalamKota/
# ---------------------
@router.post("/")
async def create_DinasDalamKota(
    data: DinasDalamKotaRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        start_dt = datetime.fromisoformat(data.timeStart)
        end_dt = datetime.fromisoformat(data.timeEnd)
    except:
        raise HTTPException(400, "Invalid datetime format")

    entry = DinasDalamKota(
        name=data.name,
        division=data.division,
        purpose=data.purpose,
        time_start=start_dt,
        time_end=end_dt,
        status=data.status,
        approval_status="pending",
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Request saved", "id": entry.id}


# ---------------------
# STAFF: GET MY REQUESTS
# GET /dinasDalamKota/my
# ---------------------
@router.get("/my")
async def get_my_DinasDalamKota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(DinasDalamKota).filter(
        DinasDalamKota.name == current_user.name
    ).all()


# ---------------------
# ADMIN: GET ALL
# GET /dinasDalamKota/
# ---------------------
@router.get("/")
async def get_all_DinasDalamKota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(DinasDalamKota).all()


# ---------------------
# ADMIN: APPROVE
# PUT /dinasDalamKota/{id}/approve
# ---------------------
@router.put("/{id}/approve")
async def approve_DinasDalamKota(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.approval_status = "approved"
    req.approved_by = current_user.name

    db.commit()
    return {"message": "approved", "id": id}


# ---------------------
# ADMIN: DENY
# PUT /dinasDalamKota/{id}/deny
# ---------------------
@router.put("/{id}/deny")
async def deny_DinasDalamKota(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.approval_status = "denied"
    req.approved_by = current_user.name

    db.commit()
    return {"message": "denied", "id": id}
