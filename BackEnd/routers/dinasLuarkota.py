from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasLuarKota
from BackEnd.database import get_db
from .auth import get_current_user

router = APIRouter()

# -----------------------
# Helpers
# -----------------------
def parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except:
        return None


# -----------------------
# Pydantic Input Model
# -----------------------
class DinasLuarKotaRequest(BaseModel):
    name: str
    department: str
    destination: str
    purpose: str
    needs: str | None = None

    companions: str | None = None
    companion_purpose: str | None = None

    depart_date: str
    return_date: str

    transport_type: str
    items_brought: str | None = None


# -----------------------
# CREATE
# POST /dinasLuarKota/
# -----------------------
@router.post("/")
async def create_dinas_luar_kota(
    data: DinasLuarKotaRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    entry = DinasLuarKota(
        name=data.name,
        department=data.department,
        destination=data.destination,
        purpose=data.purpose,
        needs=data.needs,

        companions=data.companions,
        companion_purpose=data.companion_purpose,

        depart_date=parse_date(data.depart_date),
        return_date=parse_date(data.return_date),

        transport_type=data.transport_type,
        items_brought=data.items_brought,

        approval_status="pending",
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "SPPD submitted", "id": entry.id}


# -----------------------
# STAFF GET MY REQUESTS
# GET /dinasLuarKota/my
# -----------------------
@router.get("/my")
async def get_my_luar_kota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(DinasLuarKota).filter(
        DinasLuarKota.name == current_user.name
    ).all()


# -----------------------
# ADMIN GET ALL
# GET /dinasLuarKota/
# -----------------------
@router.get("/")
async def get_all_luar_kota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(DinasLuarKota).all()


# -----------------------
# ADMIN APPROVE (1st)
# -----------------------
@router.put("/{id}/approve")
async def approve_luar_kota(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    req.approval_status = "approved"
    req.approved_by = current_user.name

    db.commit()
    return {"message": "approved", "id": id}


# -----------------------
# ADMIN DENY
# -----------------------
@router.put("/{id}/deny")
async def deny_luar_kota(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    req.approval_status = "denied"
    req.approved_by = current_user.name

    db.commit()
    return {"message": "denied", "id": id}
