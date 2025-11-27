# BackEnd/routers/pribadi.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from BackEnd.database import get_db
from BackEnd.models import Pribadi
from .auth import get_current_user
from .utils import get_div_head_role

router = APIRouter()

# ---------------------------
# Pydantic model
# ---------------------------
class PribadiRequest(BaseModel):
    name: str
    title: str
    requestType: str
    division: str

    date: str | None = None
    shortHour: str | None = None

    comeLateDate: str | None = None
    comeLateHour: str | None = None

    tempLeaveStart: str | None = None
    tempLeaveEnd: str | None = None


# ---------------------------
# Parsing helpers
# ---------------------------
def parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except:
        return None

def parse_time(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%H:%M").time()
    except:
        return None


# ---------------------------
# CREATE PRIVATE REQUEST
# /POST
# ---------------------------
@router.post("/")
async def create_private(data: PribadiRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    entry = Pribadi(
        name=data.name,
        title=data.title,
        division=data.division,
        request_type=data.requestType,
        day_label=data.date,
        date=parse_date(data.date),
        short_hour=parse_time(data.shortHour),
        come_late_day=data.comeLateDate,
        come_late_date=parse_date(data.comeLateDate),
        come_late_hour=parse_time(data.comeLateHour),
        temp_leave_start=parse_date(data.tempLeaveStart),
        temp_leave_end=parse_date(data.tempLeaveEnd),
        approval_status="pending"
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Private request saved", "id": entry.id}

# ---------------------------
# STAFF: GET MY REQUESTS
# /GET
# ---------------------------
@router.get("/my")
async def get_my_private(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Pribadi).filter(Pribadi.name == current_user.name).all()

# ---------------------------
# ADMIN: GET ALL
# ---------------------------
@router.get("/all")
async def get_all_private(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    return db.query(Pribadi).all()

# ---------------------------
# DIV_HEAD: GET ALL
# ---------------------------
@router.get("/by-division")
async def get_private_by_division(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # determine user's division role — only allow if user is a div head
    role = current_user.role
    # allow both DIV_HEAD_* roles and admin (admin can view everything)
    if role == "admin":
        return db.query(Pribadi).filter(Pribadi.approval_status == "pending").all()

    # only division heads allowed
    if not role.startswith("DIV_HEAD_"):
        raise HTTPException(403, "Admin or Division head only")

    # map DIV_HEAD_OPS -> OPS
    division = role.replace("DIV_HEAD_", "")
    # find pending private requests for this division that still need division head approval
    return db.query(Pribadi).filter(
        Pribadi.division.ilike(division),
        Pribadi.approval_status == "pending",
        Pribadi.approval_div_head.is_(None)
    ).all()

# ---------------------------
# DIV_HEAD: APPROVE
# ---------------------------
@router.put("/{id}/div-head-approve")
async def div_head_approve(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    # only appropriate div head can approve
    div_head = get_div_head_role(req.division)
    if current_user.role != div_head:
        raise HTTPException(403, "Only the division head can approve this step")

    # division head cannot self-approve their own request
    if current_user.name == req.name:
        raise HTTPException(403, "Division head cannot self-approve; admin approval required")

    req.approval_div_head = "approved"
    db.commit()
    return {"message": "division head approved"}

# ---------------------------
# DIV_HEAD: DENY
# ---------------------------
@router.put("/{id}/div-head-deny")
async def div_head_deny(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    div_head = get_div_head_role(req.division)
    if current_user.role != div_head:
        raise HTTPException(403, "Only the division head can deny this step")
    req.approval_status = "denied"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "division head denied"}


# ---------------------------
# ADMIN: APPROVE
# ---------------------------
@router.put("/{id}/approve")
async def approve_private(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    # If division head approval required but not done, block
    div_head_role = get_div_head_role(req.division)
    requester_is_div_head = (req.name and get_div_head_role(req.division) == req.name)
    if req.approval_div_head is None and not (req.name and current_user.role == "admin" and requester_is_div_head):
        raise HTTPException(403, "Waiting for division head approval")
    req.approval_admin = "approved"
    req.approval_status = "approved"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "admin approved"}

# ---------------------------
# ADMIN: DENY
# ---------------------------
@router.put("/{id}/deny")
async def deny_private(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["admin", get_div_head_role("OPS"), get_div_head_role("HRD"), get_div_head_role("HSE"), get_div_head_role("MARKETING"), get_div_head_role("FINANCE")]:
        # allow admin and any div head (we'll check per-request above) - simpler check; specific check below
        pass
    req = db.query(Pribadi).filter(Pribadi.id == id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    allowed_roles = { get_div_head_role(req.division), "admin" }
    if current_user.role not in allowed_roles:
        raise HTTPException(403, "Not authorized to deny")
    req.approval_status = "denied"
    req.approved_by = current_user.name
    db.commit()
    return {"message": "denied"}
