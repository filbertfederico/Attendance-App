# routers/dinas.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from BackEnd.models import Dinas
from BackEnd.database import get_db
from routers.firebase_auth import get_current_user

router = APIRouter()

# ---------------------
# Pydantic model
# ---------------------
class DinasRequest(BaseModel):
    name: str
    division: str
    purpose: str
    timeStart: str
    timeEnd: str
    status: str


# ---------------------
# CREATE DINAS
# POST /dinas/
# ---------------------
@router.post("/")
async def create_dinas(
    data: DinasRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    try:
        start_dt = datetime.fromisoformat(data.timeStart)
        end_dt = datetime.fromisoformat(data.timeEnd)
    except:
        raise HTTPException(400, "Invalid datetime format")

    entry = Dinas(
        name=data.name,
        division=data.division,
        purpose=data.purpose,
        time_start=start_dt,
        time_end=end_dt,
        status=data.status,
        approval_status="pending"
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Dinas request saved", "id": entry.id}


# ---------------------
# STAFF: GET MY DINAS
# GET /dinas/my
# ---------------------
@router.get("/my")
async def get_my_dinas(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.query(Dinas).filter(Dinas.name == current_user["user_id"]).all()
    return result


# ---------------------
# ADMIN: GET ALL DINAS
# GET /dinas/
# ---------------------
@router.get("/")
async def get_all_dinas(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user["role"] != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(Dinas).all()


# ---------------------
# ADMIN: APPROVE
# PUT /dinas/{id}/approve
# ---------------------
@router.put("/{id}/approve")
async def approve_dinas(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Dinas).filter(Dinas.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.approval_status = "approved"
    req.approved_by = current_user["user_id"]
    db.commit()

    return {"message": "approved", "id": id}


# ---------------------
# ADMIN: DENY
# PUT /dinas/{id}/deny
# ---------------------
@router.put("/{id}/deny")
async def deny_dinas(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(Dinas).filter(Dinas.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.approval_status = "denied"
    req.approved_by = current_user["user_id"]
    db.commit()

    return {"message": "denied", "id": id}
