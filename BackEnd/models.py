from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Text
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="staff")
    division = Column(String, nullable=False)

class DinasDalamKota(Base):
    __tablename__ = "dinasDalamKota"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    division = Column(String, nullable=False)
    purpose = Column(Text, nullable=False)
    time_start = Column(DateTime, nullable=False)
    time_end = Column(DateTime, nullable=False)
    status = Column(String, nullable=False)
    approval_div_head = Column(String, nullable=True)
    approval_admin = Column(String, nullable=True)
    approval_status = Column(String, default="pending")
    approved_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class DinasLuarKota(Base):
    __tablename__ = "dinasLuarKota"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    division = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    purpose = Column(Text, nullable=False)
    needs = Column(String, nullable=True)
    companions = Column(String, nullable=True)
    companion_purpose = Column(String, nullable=True)
    depart_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=False)
    transport_type = Column(String, nullable=False)
    items_brought = Column(String, nullable=True)
    approval_div_head = Column(String, nullable=True)
    approval_hrd = Column(String, nullable=True)
    approval_finance = Column(String, nullable=True)
    approval_admin = Column(String, nullable=True)
    approval_status = Column(String, default="pending")
    approved_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Pribadi(Base):
    __tablename__ = "pribadi"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    division = Column(String, nullable=False)
    title = Column(String, nullable=False)
    request_type = Column(String, nullable=False)
    day_label = Column(String, nullable=True)
    date = Column(Date, nullable=True)
    short_hour = Column(Time, nullable=True)
    come_late_day = Column(String, nullable=True)
    come_late_date = Column(Date, nullable=True)
    come_late_hour = Column(Time, nullable=True)
    temp_leave_start = Column(Date, nullable=True)
    temp_leave_end = Column(Date, nullable=True)
    approval_div_head = Column(String, nullable=True)
    approval_admin = Column(String, nullable=True)
    approval_status = Column(String, default="pending")
    approved_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Cuti(Base):
    __tablename__ = "cuti"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    role = Column(String)
    division = Column(String)

    cuti_type = Column(String)
    date_start = Column(Date)
    date_end = Column(Date)
    duration = Column(Integer)

    purpose = Column(String)
    address = Column(String)
    phone = Column(String)
    notes = Column(String)

    leave_days = Column(Integer)
    leave_remaining = Column(Integer)

    # APPROVAL PIPELINE
    approval_div_head = Column(String, default=None)
    approval_hrd = Column(String, default=None)
    approval_admin = Column(String, default=None)

    # final status
    approval_status = Column(String, default="pending")
    approved_by = Column(String, default=None)

    created_at = Column(DateTime, default=datetime.now)
