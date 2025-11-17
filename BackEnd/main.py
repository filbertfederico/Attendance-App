# BackEnd/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from BackEnd.routers.dinas import router as dinas_router
from BackEnd.routers.pribadi import router as pribadi_router

app = FastAPI()

# Define allowed origins (optional: "*" below overrides this)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://attendance-app-befe2.web.app",
    "https://attendance-app-befe2.firebaseapp.com"
]

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all FE origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dinas_router, prefix="/dinas", tags=["Dinas"])
app.include_router(pribadi_router, prefix="/private", tags=["Pribadi"])

@app.get("/")
def home():
    return {"message": "Permission Slip API is running"}
