import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found in .env")

# If URL already includes ?sslmode=require, SQLAlchemy doesn't need connect_args
needs_ssl = "sslmode=require" in DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"} if needs_ssl else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
