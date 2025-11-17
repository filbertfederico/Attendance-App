# BackEnd/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://appuser:12345@localhost:5432/attendance_db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

#Dependency for routers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()