# BackEnd/routers/dinasDalamKota.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasDalamKota
from BackEnd.database import get_db
from .auth import get_current_user

from .utils import get_div_head_role

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
def get_dinas_dalam_by_division(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    div = current_user.division

    if not div.startswith("DIV_HEAD_"):
        raise HTTPException(403, "Division head only")

    user_div = div.replace("DIV_HEAD_", "")

    return (
        db.query(DinasDalamKota)
        .filter(DinasDalamKota.division == user_div)
        .filter(DinasDalamKota.approval_status == "pending")
        .all()
    )


@router.put("/{id}/div-head-approve")
def approve_dinas_dalam(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    required = get_div_head_role(req.division)

    if current_user.division != required:
        raise HTTPException(403, "Not authorized")

    req.approval_status = "approved"
    db.commit()
    return {"message": "Request approved"}


@router.put("/{id}/div-head-deny")
def deny_dinas_dalam(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Not found")

    required = get_div_head_role(req.division)

    if current_user.division != required:
        raise HTTPException(403, "Not authorized")

    req.approval_status = "rejected"
    db.commit()
    return {"message": "Request rejected"}

@router.put("/{id}/approve")
async def approve_dinas(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    div_head_role = get_div_head_role(req.division)
    is_requester_div_head = (req.name and current_user.division == div_head_role and current_user.name == req.name)

    # Division head approval
    if current_user.division == div_head_role and req.approval_div_head != "approved":
        if current_user.name == req.name:
            raise HTTPException(403, "Division head cannot self-approve; admin approval required")
        req.approval_div_head = "approved"
        db.commit()
        return {"message": "division head approved"}

    # Admin final approval
    if current_user.role == "admin":
        if not (req.approval_div_head == "approved" or is_requester_div_head):
            raise HTTPException(403, "Waiting for division head approval")
        req.approval_admin = "approved"
        req.approval_status = "approved"
        req.approved_by = current_user.name
        db.commit()
        return {"message": "admin approved"}

    raise HTTPException(403, "Not authorized to approve")

@router.put("/{id}/deny")
async def deny_DinasDalamKota(
    id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if current_user.division in {get_div_head_role(req.division), "DIV_HEAD_HRD", "DIV_HEAD_FINANCE", "admin"}:
        req.approval_status = "denied"
        req.approved_by = current_user.name
        db.commit()
        return {"message": "denied"}
    raise HTTPException(403, "Not authorized to deny")
