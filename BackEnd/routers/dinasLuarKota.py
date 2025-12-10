# BackEnd/routers/dinasLuarKota.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
def get_dinas_luar_by_division(db: Session = Depends(get_db), current_user=Depends(get_current_user)):    
    if is_hrd_staff(current_user):
        return db.query(DinasLuarKota).order_by(DinasLuarKota.created_at.desc()).all()
            
    if current_user.role != "div_head":
        raise HTTPException(403, "Division head only")

    if is_hrd_head(current_user):
        return db.query(DinasLuarKota).order_by(DinasLuarKota.created_at.desc()).all()
    
    return db.query(DinasLuarKota)\
        .filter(DinasLuarKota.division == current_user.division)\
        .order_by(DinasLuarKota.created_at.desc())\
        .all()


@router.put("/{id}/div-head-approve")
def approve_dinas_luar(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403, "Not authorized")

    req.approval_status = "approved"
    db.commit()
    return {"message": "Request approved"}


@router.put("/{id}/div-head-deny")
def deny_dinas_luar(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not is_div_head_of_division(current_user, req.division):
        raise HTTPException(403, "Not authorized")

    req.approval_status = "rejected"
    db.commit()
    return {"message": "Request rejected"}


@router.put("/{id}/hrd-approve")
async def hrd_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if not is_hrd_head(current_user):
        raise HTTPException(403, "Only HRD head can approve")
    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for division head approval")
    req.approval_hrd = "approved"
    db.commit()
    return {"message": "HRD approved"}


@router.put("/{id}/hrd-deny")
async def hrd_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if not is_hrd_head(current_user):
        raise HTTPException(403, "Only HRD head can deny")
    req.approval_status = "denied"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "HRD denied"}


@router.put("/{id}/finance-approve")
async def finance_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if not is_finance_head(current_user):
        raise HTTPException(403, "Only Finance head can approve")
    if req.approval_hrd != "approved":
        raise HTTPException(403, "Waiting for HRD approval")
    req.approval_finance = "approved"
    db.commit()
    return {"message": "Finance approved"}


@router.put("/{id}/approve")
async def admin_approve(id:int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin" and current_user.role != "ADMIN":
        raise HTTPException(403, "Admin only")
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id==id).first()
    if not req: raise HTTPException(404, "Not found")
    if not req.approval_finance:
        raise HTTPException(403, "Waiting for Finance")
    req.approval_admin = current_user.name
    req.approval_status = "approved"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "admin approved"}


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
