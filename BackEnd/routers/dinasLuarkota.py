from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasLuarKota
from BackEnd.database import get_db
from .auth import get_current_user

from .utils import get_div_head_role

router = APIRouter()

# -----------------------
# Pydantic Input Model
# -----------------------
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
# ADMIN GET BY DIV
# GET
# -----------------------
@router.get("/by-division")
async def get_by_division(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    role = current_user.role
    if role == "admin":
        return db.query(DinasLuarKota).filter(DinasLuarKota.approval_status == "pending").all()
    if not role.startswith("DIV_HEAD_"):
        raise HTTPException(403, "Admin or Division head only")
    division = role.replace("DIV_HEAD_", "")
    # requests that still need division head approval for this division
    return db.query(DinasLuarKota).filter(
        DinasLuarKota.division.ilike(division),
        DinasLuarKota.approval_status == "pending",
        DinasLuarKota.approval_div_head.is_(None)
    ).all()

# -----------------------
# ADMINs APPROVE
# -----------------------
# Div_Head
@router.put("/{id}/div-head-approve")
async def div_head_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    div_head = get_div_head_role(req.division)
    if current_user.role != div_head:
        raise HTTPException(403, "Only division head can approve this step")
    if req.name == current_user.name:
        raise HTTPException(403, "Division head cannot self-approve; HRD must start approvals")
    req.approval_div_head = "approved"
    db.commit()
    return {"message": "division head approved"}

@router.put("/{id}/div-head-deny")
async def div_head_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    div_head = get_div_head_role(req.division)
    if current_user.division != div_head:
        raise HTTPException(403, "Only division head can deny")
    req.approval_status = "denied"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "division head denied"}

# HRD
@router.put("/{id}/hrd-approve")
async def hrd_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if current_user.role != "DIV_HEAD_HRD":
        raise HTTPException(403, "Only HRD head can approve")
    # require division head approved OR requester is div head (so division head step skipped)
    if not (req.approval_div_head == "approved" or get_div_head_role(req.division) == req.name):
        raise HTTPException(403, "Waiting for division head approval")
    req.approval_hrd = "approved"
    db.commit()
    return {"message": "HRD approved"}

@router.put("/{id}/hrd-deny")
async def hrd_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if current_user.role != "DIV_HEAD_HRD":
        raise HTTPException(403, "Only HRD head can deny")
    req.approval_status = "denied"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "HRD denied"}

# 3) Finance
@router.put("/{id}/finance-approve")
async def finance_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if current_user.role != "DIV_HEAD_FINANCE":
        raise HTTPException(403, "Only Finance head can approve")
    if req.approval_hrd != "approved":
        raise HTTPException(403, "Waiting for HRD approval")
    req.approval_finance = "approved"
    db.commit()
    return {"message": "Finance approved"}

# Admin final approval
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


# -----------------------
# ADMIN DENY
# -----------------------
@router.put("/{id}/deny")
async def deny_luar_kota(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    # Allow any approver in chain to deny (div head / HRD / Finance / Admin)
    allowed_roles = { get_div_head_role(req.division), "DIV_HEAD_HRD", "DIV_HEAD_FINANCE", "admin" }
    if current_user.role in allowed_roles:
        req.approval_status = "denied"
        req.approved_by = current_user.name
        db.commit()
        return {"message": "denied"}
    raise HTTPException(403, "Not authorized to deny")
