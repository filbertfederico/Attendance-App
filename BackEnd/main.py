# BackEnd/main.py
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from .database import Base, engine
from BackEnd.routers.auth import router as auth_router
from BackEnd.routers.pribadi import router as pribadi_router
from BackEnd.routers.dinas import router as dinas_router


# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Attendance API")

# Allowed origins
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://attendance-app-befe2.web.app",
    "https://attendance-app-befe2.firebaseapp.com"
]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(pribadi_router, prefix="/private", tags=["Pribadi"])
app.include_router(dinas_router, prefix="/dinas", tags=["Dinas"])

@app.get("/")
def home():
    return {"message": "Permission Slip API is running"}
