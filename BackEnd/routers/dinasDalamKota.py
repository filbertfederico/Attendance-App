# routers/dinasDalamKota.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasDalamKota
from BackEnd.database import get_db
from .auth import get_current_user

from .utils import get_div_head_role

router = APIRouter()

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
    
# parser
def parse_dt(value: str):
    try:
        return datetime.fromisoformat(value)
    except:
        raise

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
# DIV_HEAD: GET MY REQUESTS
# ---------------------
@router.get("/by-division")
async def get_by_division(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    role = current_user.role
    if role == "admin":
        return db.query(DinasDalamKota).filter(DinasDalamKota.approval_status == "pending").all()
    if not role.startswith("DIV_HEAD_"):
        raise HTTPException(403, "Admin or Division head only")
    division = role.replace("DIV_HEAD_", "")
    return db.query(DinasDalamKota).filter(
        DinasDalamKota.division.ilike(division),
        DinasDalamKota.approval_status == "pending",
        DinasDalamKota.approval_div_head.is_(None)
    ).all()

# ---------------------
# DIV_HEAD: APPROVAL
# PUT
# ---------------------
@router.put("/{id}/div-head-approve")
def div_head_approve(id, current_user, db):

    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()

    if req.approval_status != "waiting_div_head":
        raise HTTPException(400, "Already processed")

    req.approval_status = "waiting_admin"
    req.approved_by = current_user.name

    db.commit()
    return {"message": "Division head approved"}

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
async def approve_dinas(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    div_head_role = get_div_head_role(req.division)
    is_requester_div_head = (req.name and current_user.role == div_head_role and current_user.name == req.name)

    # Division head approval
    if current_user.role == div_head_role and req.approval_div_head != "approved":
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
    req = db.query(DinasDalamKota).filter(DinasDalamKota.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    if current_user.role in [get_div_head_role(req.division), "admin"]:
        req.approval_status = "denied"
        req.approved_by = current_user.name
        db.commit()
        return {"message": "denied"}
    raise HTTPException(403, "Not authorized to deny")
