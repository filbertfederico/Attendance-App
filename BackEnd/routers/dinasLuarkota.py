# routers/dinasLuarKota.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from BackEnd.models import DinasDalamKota
from BackEnd.database import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/dinasLuarKota",
    tags=["Dinas luar Kota"]
)