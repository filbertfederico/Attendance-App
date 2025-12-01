from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
load_dotenv()
print("CWD:", os.getcwd())
print("ENV_DATABASE_URL:", os.getenv("DATABASE_URL"))

from BackEnd.database import Base, engine
from BackEnd.routers.auth import router as auth_router
from BackEnd.routers.pribadi import router as pribadi_router
from BackEnd.routers.dinasDalamKota import router as dinasDalamKota_router
from BackEnd.routers.dinasLuarKota import router as dinasLuarKota_router
from BackEnd.routers.cuti import router as cuti_router

app = FastAPI()

# -----------------------------
# CORS (correct version)
# -----------------------------
frontend_origins = [
    "https://attendance-app-befe2.web.app",
    "https://attendance-app-befe2.firebaseapp.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "IMS Attendance API Running"}

# Routes
app.include_router(auth_router, prefix="/auth")
app.include_router(pribadi_router, prefix="/private")
app.include_router(dinasDalamKota_router, prefix="/dinasDalamKota")
app.include_router(dinasLuarKota_router, prefix="/dinasLuarKota")
app.include_router(cuti_router, prefix="/cuti")

# Debug
@app.get("/__debug")
def debug():
    return {
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "FRONTEND_ALLOWED": frontend_origins
    }

@app.get("/test-auth-me")
def test_me():
    return {"working": True}

Base.metadata.create_all(bind=engine)