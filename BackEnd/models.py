from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Text
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="staff")


class Dinas(Base):
    __tablename__ = "dinas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    division = Column(String, nullable=False)
    purpose = Column(Text, nullable=False)

    time_start = Column(DateTime, nullable=False)
    time_end = Column(DateTime, nullable=False)

    status = Column(String, nullable=False)
    approval_status = Column(String, default="pending")
    approved_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Pribadi(Base):
    __tablename__ = "pribadi"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    request_type = Column(String, nullable=False)

    day_label = Column(String, nullable=True)
    date = Column(Date, nullable=True)

    short_hour = Column(Time, nullable=True)

    come_late_day = Column(String, nullable=True)
    come_late_date = Column(Date, nullable=True)
    come_late_hour = Column(Time, nullable=True)

    temp_leave_day = Column(String, nullable=True)
    temp_leave_date = Column(Date, nullable=True)

    approval_status = Column(String, default="pending")
    approved_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
