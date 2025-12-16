# BackEnd/routers/dinasLuarKota.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func 
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasLuarKota
from BackEnd.database import get_db
from .auth import get_current_user

from .utils import is_hrd_head
from .utils import is_finance_head
from .utils import is_div_head_of_division, is_hrd_staff, is_hrd_head

router = APIRouter()

class DinasLuarKotaRequest(BaseModel):
    name: str
    division: str
    destination: str
    purpose: str
    needs: str | None = None
    companions: str | None = None
    companion_purpose: str | None = None
    depart_date: str
    return_date: str
    transport_type: str
    items_brought: str | None = None

def parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except:
        return None

@router.post("/")
async def create_dinas_luar_kota(
    data: DinasLuarKotaRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = DinasLuarKota(
        name=data.name,
        division=data.division,
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


@router.get("/my")
async def get_my_luar_kota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(DinasLuarKota).filter(
        DinasLuarKota.name == current_user.name
    ).all()


@router.get("/")
async def get_all_luar_kota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(DinasLuarKota).all()


@router.get("/by-division")
def get_dinas_luar_by_division(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    role = (current_user.role or "").lower()
    division = (current_user.division or "").upper()

    if role not in ["div_head", "staff"]:
        raise HTTPException(403, "Not allowed")

    # HRD sees all
    if is_hrd_head(current_user) or is_hrd_staff(current_user):
        return db.query(DinasLuarKota)\
            .order_by(DinasLuarKota.created_at.desc())\
            .all()

    # Division head sees their division
    if role == "div_head":
        return db.query(DinasLuarKota)\
            .filter(func.upper(DinasLuarKota.division) == division)\
            .order_by(DinasLuarKota.created_at.desc())\
            .all()

    # Staff sees own
    return db.query(DinasLuarKota)\
        .filter(DinasLuarKota.name == current_user.name)\
        .order_by(DinasLuarKota.created_at.desc())\
        .all()

@router.put("/{id}/div-head-approve")
def approve_dinas_luar(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403, "Not authorized")

    if req.approval_div_head is not None:
        raise HTTPException(400, "Already processed")

    req.approval_div_head = "approved"
    req.approval_status = "pending"        
    db.commit()
    db.refresh(req)
    return req


@router.put("/{id}/div-head-deny")
def deny_dinas_luar(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403, "Not authorized")

    req.approval_div_head = "rejected"
    req.approval_status = "rejected"
    req.approved_by = current_user.name

    db.commit()
    return req


@router.put("/{id}/hrd-approve")
async def hrd_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if not is_hrd_head(current_user):
        raise HTTPException(403, "Only HRD head can approve")

    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for division head approval")

    if req.approval_hrd is not None:
        raise HTTPException(400, "Already processed")

    req.approval_hrd = "approved"
    db.commit()
    return req


@router.put("/{id}/hrd-deny")
async def hrd_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if not is_hrd_head(current_user):
        raise HTTPException(403, "Only HRD head can deny")

    req.approval_hrd = "rejected"
    req.approval_status = "rejected"
    req.approved_by = current_user.name

    db.commit()
    return req


@router.put("/{id}/finance-approve")
async def finance_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if not is_finance_head(current_user):
        raise HTTPException(403, "Only Finance head can approve")
    if req.approval_hrd != "approved":
        raise HTTPException(403, "Waiting for HRD approval")
    if req.approval_finance is not None:
        raise HTTPException(400, "Already processed")
    req.approval_finance = "approved"
    db.commit()
    return {"message": "Finance approved"}


@router.put("/{id}/approve")
async def admin_approve(id:int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role.lower() != "admin":
        raise HTTPException(403, "Admin only")

    req = db.query(DinasLuarKota).filter(DinasLuarKota.id==id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if req.approval_finance != "approved":
        raise HTTPException(403, "Waiting for Finance")

    if req.approval_status == "approved":
        raise HTTPException(400, "Already approved")

    req.approval_admin = "approved"
    req.approval_status = "approved"
    req.approved_by = current_user.name

    db.commit()
    return req


@router.put("/{id}/deny")
async def deny_luar_kota(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if (
    is_div_head_of_division(current_user, req.division)
        or is_hrd_head(current_user)
        or is_finance_head(current_user)
        or current_user.role == "admin"
    ):
        req.approval_status = "denied"
        req.approved_by = current_user.name
        db.commit()
        return {"message": "Denied"}
    
    raise HTTPException(403, "Not authorized")
