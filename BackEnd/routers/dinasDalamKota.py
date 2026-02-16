# BackEnd/routers/dinasDalamKota.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasDalamKota
from BackEnd.database import get_db
from .auth import get_current_user

from .utils import is_div_head_of_division, is_hrd_head, is_hrd_staff
from auth import require_admin

router = APIRouter()

class DinasDalamKotaRequest(BaseModel):
    name: str
    division: str
    purpose: str
    timeStart: str
    timeEnd: str
    status: str

def parse_dt(value: str):
    try:
        return datetime.fromisoformat(value)
    except:
        raise

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
        name=current_user.name,         
        division=current_user.division, 
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

@router.get("/")
async def get_all_DinasDalamKota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    return db.query(DinasDalamKota).all()


@router.get("/my")
async def get_my_DinasDalamKota(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(DinasDalamKota).filter(
        DinasDalamKota.name == current_user.name
    ).all()


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
            db.query(DinasDalamKota)
            .order_by(DinasDalamKota.created_at.desc())
            .all()
        )

    # ✅ DIV HEAD sees own division
    if role == "div_head":
        return (
            db.query(DinasDalamKota)
            .filter(DinasDalamKota.division == division)
            .order_by(DinasDalamKota.created_at.desc())
            .all()
        )

    # ✅ STAFF sees own only
    return (
        db.query(DinasDalamKota)
        .filter(DinasDalamKota.name == current_user.name)
        .order_by(DinasDalamKota.created_at.desc())
        .all()
    )


@router.put("/{id}/div-head-approve")
def div_head_approve(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    if current_user.role != "div_head":
        raise HTTPException(403, "Div head only")

    form = db.query(DinasDalamKota).get(id)
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
def hrd_approve_dinas_dalam(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not is_hrd_head(current_user):
        raise HTTPException(403, "HRD head only")

    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
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
def deny_dinas_dalam(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    if not (
        is_div_head_of_division(current_user, DinasDalamKota.division)
        or is_hrd_head(current_user)
    ):
        raise HTTPException(403, "Not allowed")

    req.approval_div_head = "rejected"
    req.approval_status = "rejected"
    req.approved_by = current_user.name

    db.commit()
    return req

# @router.put("/{id}/approve")
# async def approve_dinas(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
#     req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
#     if not req:
#         raise HTTPException(404, "Request not found")

#     # Division head approval path
#     if is_div_head_of_division(current_user, req.division):
#         if current_user.name == req.name:
#             raise HTTPException(403, "Division head cannot self-approve; admin approval required")
#         req.approval_div_head = "approved"
#         db.commit()
#         return {"message": "division head approved"}

#     # Admin final approval
#     if current_user.role == "admin":
#         if req.approval_div_head != "approved":
#             raise HTTPException(403, "Waiting for division head approval")
#         req.approval_admin = "approved"
#         req.approval_status = "approved"
#         req.approved_by = current_user.name
#         db.commit()
#         return {"message": "admin approved"}

#     raise HTTPException(403, "Not authorized to approve")


# @router.put("/{id}/deny")
# async def deny_DinasDalamKota(
#     id: int,
#     current_user=Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
#     if not req:
#         raise HTTPException(404, "Request not found")

#     if (
#         is_div_head_of_division(current_user, req.division)
#         or is_hrd_head(current_user)
#         or current_user.role == "admin"
#     ):
#         req.approval_status = "denied"
#         req.approved_by = current_user.name
#         db.commit()
#         return {"message": "denied"}
#     raise HTTPException(403, "Not authorized to deny")

@router.put("/{id}/approve")
def admin_approve_dalam(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()

    if not req:
        raise HTTPException(404, "Request not found")

    if req.approval_status != "pending":
        raise HTTPException(400, "Already finalized")

    if req.approval_div_head != "approved":
        raise HTTPException(403, "Waiting for Div Head approval")

    req.approval_admin = "approved"
    req.approval_status = "approved"
    req.approved_by = current_user.name

    db.commit()
    db.refresh(req)

    return {"message": "Dinas Dalam Kota approved"}

@router.put("/{id}/deny")
def admin_deny_dalam(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()

    if not req:
        raise HTTPException(404, "Request not found")

    if req.approval_status != "pending":
        raise HTTPException(400, "Already finalized")

    req.approval_admin = "denied"
    req.approval_status = "denied"
    req.approved_by = current_user.name

    db.commit()
    db.refresh(req)

    return {"message": "Dinas Dalam Kota denied by Admin"}

