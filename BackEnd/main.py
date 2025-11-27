# BackEnd/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
# Load .env
load_dotenv()
import os

from BackEnd import models

from starlette.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request, HTTPException

from BackEnd.database import Base, engine
from BackEnd.routers.auth import router as auth_router
from BackEnd.routers.pribadi import router as pribadi_router
from BackEnd.routers.dinasDalamKota import router as dinasDalamKota_router
from BackEnd.routers.dinasLuarkota import router as dinasLuarkota_router


app = FastAPI()

# -----------------------------
# CORS ORIGINS
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://192.168.56.1:3000",
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

@app.exception_handler(HTTPException)
async def cors_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={"Access-Control-Allow-Origin": "*"},
    )

@app.exception_handler(RequestValidationError)
async def cors_validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers={"Access-Control-Allow-Origin": "*"},
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
app.include_router(dinasDalamKota_router, prefix="/dinasDalamKota")
app.include_router(dinasLuarkota_router, prefix="/dinasLuarkota")


# -----------------------------
# CREATE TABLES ON STARTUP
# -----------------------------
Base.metadata.create_all(bind=engine)
