# BackEnd/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from BackEnd.database import Base, engine
from BackEnd.routers.auth import router as auth_router
from BackEnd.routers.pribadi import router as pribadi_router
from BackEnd.routers.dinas import router as dinas_router

# Load .env
load_dotenv()

app = FastAPI()

# -----------------------------
# CORS ORIGINS
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://localhost:5173",

    # Firebase Hosting
    "https://attendance-app-befe2.web.app",
    "https://attendance-app-befe2.firebaseapp.com",

    # Render Backend URL
    "https://attendance-app-vwy8.onrender.com",
]

# -----------------------------
# ADD CORS MIDDLEWARE
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# ROOT ROUTE
# -----------------------------
@app.get("/")
def home():
    return {"message": "Permission Slip API is running"}


# -----------------------------
# INCLUDE ROUTERS
# -----------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(pribadi_router, prefix="/private")
app.include_router(dinas_router, prefix="/dinas")


# -----------------------------
# CREATE TABLES ON STARTUP
# -----------------------------
Base.metadata.create_all(bind=engine)
