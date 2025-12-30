import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from database import ping_server
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router
from auth import router as auth_router

load_dotenv()

app = FastAPI()

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://192.168.1.3:5137,http://localhost:5137").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(auth_router)

@app.get("/healthz")
async def health_check():
    if await ping_server():
        return {"status": "ok", "db_status": "connected"}
    else:
        raise HTTPException(status_code=503, detail="Database connection failed")

@app.get("/")
def read_root():
    return {"Hello": "World"}