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
from auth import require_admin

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
        name=current_user.name,
        division=current_user.division,
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
def get_by_division(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = (current_user.role or "").lower()
    division = (current_user.division or "").upper()

    # ✅ HRD (STAFF + DIV HEAD) SEE EVERYTHING
    if is_hrd_head(current_user) or is_hrd_staff(current_user):
        return (
            db.query(DinasLuarKota)   # ← replace DinasLuarKota per file
            .order_by(DinasLuarKota.created_at.desc())
            .all()
        )

    # ✅ DIV HEAD sees own division
    if role == "div_head":
        return (
            db.query(DinasLuarKota)
            .filter(DinasLuarKota.division == division)
            .order_by(DinasLuarKota.created_at.desc())
            .all()
        )

    # ✅ STAFF sees own only
    return (
        db.query(DinasLuarKota)
        .filter(DinasLuarKota.name == current_user.name)
        .order_by(DinasLuarKota.created_at.desc())
        .all()
    )

@router.put("/{id}/div-head-approve")
def div_head_approve(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    if current_user.role != "div_head":
        raise HTTPException(403, "Div head only")

    form = db.query(DinasLuarKota).get(id)
    if not form:
        raise HTTPException(404)

    # 🔑 HRD & GA div head can approve ALL
    if is_hrd_head(current_user):
        form.approval_div_head = "approved"
        form.approval_hrd = "approved"
        form.approval_status = "approved"
        db.commit()
        return {"message": "Approved by HRD & GA"}

    # 🔒 Normal div head → only own division
    if form.division != current_user.division:
        raise HTTPException(403, "Not your division")

    form.approval_div_head = "approved"
    form.approval_status = "pending_hrd"
    db.commit()

    return {"message": "Approved by div head"}

@router.put("/{id}/hrd-approve")
def hrd_approve_dinas_luar(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not is_hrd_head(current_user):
        raise HTTPException(403, "HRD head only")

    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for div head")

    req.approval_hrd = "approved"
    req.approval_status = "approved"
    req.approved_by = current_user.name

    db.commit()
    return req



@router.put("/{id}/div-head-deny")
def deny_dinas_luar(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not (
        is_div_head_of_division(current_user, DinasLuarKota.division)
        or is_hrd_head(current_user)
    ):
        raise HTTPException(403, "Not allowed")

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
def admin_approve(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()

    if not req:
        raise HTTPException(404, "Not found")

    if req.approval_status != "pending":
        raise HTTPException(400, "Already finalized")

    if req.approval_finance != "approved":
        raise HTTPException(403, "Waiting for Finance approval")

    req.approval_admin = "approved"
    req.approval_status = "approved"
    req.approved_by = current_user.name

    db.commit()
    db.refresh(req)

    return {"message": "Final approval granted"}



@router.put("/{id}/deny")
def admin_deny_luar(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    req = db.query(DinasLuarKota).filter(DinasLuarKota.id == id).first()

    if not req:
        raise HTTPException(404, "Request not found")

    if req.approval_status != "pending":
        raise HTTPException(400, "Already finalized")

    req.approval_admin = "denied"
    req.approval_status = "denied"
    req.approved_by = current_user.name

    db.commit()
    db.refresh(req)

    return {"message": "Dinas Luar Kota denied by Admin"}
