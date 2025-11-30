from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
load_dotenv()

from BackEnd.database import Base, engine
from BackEnd.routers.auth import router as auth_router
from BackEnd.routers.pribadi import router as pribadi_router
from BackEnd.routers.dinasDalamKota import router as dinasDalamKota_router
from BackEnd.routers.dinasLuarkota import router as dinasLuarkota_router

app = FastAPI()

# -------------------------------------------------------
# CORS — works for LOCAL + PRODUCTION
# -------------------------------------------------------

frontend_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.56.1:3000",

    # Firebase Hosting
    "https://attendance-app-befe2.web.app",
    "https://attendance-app-befe2.firebaseapp.com",

    # Backend production host
    REACT_APP_API_URL = os.getenv("REACT_APP_API_URL")
    
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# ROOT
# -------------------------------------------------------
@app.get("/")
def home():
    return {"message": "IMS Attendance API Running"}

# -------------------------------------------------------
# ROUTERS
# -------------------------------------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(pribadi_router, prefix="/private")
app.include_router(dinasDalamKota_router, prefix="/dinasDalamKota")
app.include_router(dinasLuarkota_router, prefix="/dinasLuarkota")

# -------------------------------------------------------
# INIT DB
# -------------------------------------------------------
Base.metadata.create_all(bind=engine)