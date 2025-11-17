# TEMP debug version — show the exception text in the response
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Dinas
from pydantic import BaseModel
import traceback

router = APIRouter()

class DinasRequest(BaseModel):
    name: str
    division: str
    purpose: str
    timeStart: str
    timeEnd: str
    status: str

@router.post("/")
async def create_dinas_request_debug(data: DinasRequest, db: Session = Depends(get_db)):
    try:
        # try parse datetimes
        start_dt = datetime.fromisoformat(data.timeStart)
        end_dt = datetime.fromisoformat(data.timeEnd)

        entry = Dinas(
            name=data.name,
            division=data.division,
            purpose=data.purpose,
            time_start=start_dt,
            time_end=end_dt,
            status=data.status
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return {"message": "Dinas request saved", "id": entry.id}

    except Exception as e:
        # return the traceback text so you can copy it here
        tb = traceback.format_exc()
        return Response(content=tb, media_type="text/plain", status_code=500)



# -----------------------
# GET staff → /dinas/my?name=John Doe
# -----------------------
@router.get("/my")
async def get_my_requests(name: str, db: Session = Depends(get_db)):
    return db.query(Dinas).filter(Dinas.name == name).all()


# -----------------------
# GET admin → /dinas/
# -----------------------
@router.get("/")
async def get_all_dinas(db: Session = Depends(get_db)):
    return db.query(Dinas).all()


# -----------------------
# PUT approve
# -----------------------
@router.put("/{id}/approve")
async def approve_dinas(id: int, db: Session = Depends(get_db)):
    req = db.query(Dinas).filter(Dinas.id == id).first()
    if not req:
        raise HTTPException(404, "Dinas request not found")

    req.approval_status = "approved"
    db.commit()
    return {"message": "Dinas approved", "id": id}


# -----------------------
# PUT deny
# -----------------------
@router.put("/{id}/deny")
async def deny_dinas(id: int, db: Session = Depends(get_db)):
    req = db.query(Dinas).filter(Dinas.id == id).first()
    if not req:
        raise HTTPException(404, "Dinas request not found")

    req.approval_status = "denied"
    db.commit()
    return {"message": "Dinas denied", "id": id}
