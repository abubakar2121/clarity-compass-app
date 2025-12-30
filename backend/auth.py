import os
from fastapi import APIRouter, HTTPException, Body, Depends, Response, Request
from typing import Optional
from pydantic import BaseModel
from models import User
from database import db
from typing import Dict, Any
import json
from bson import ObjectId
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(prefix="/api/auth")

class UserSignUp(BaseModel):
    fullName: str
    email: str
    password: str
    companySize: str

@router.post("/signup")
async def signup(user_data: UserSignUp):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())

    # Create user object
    user = {
        "fullName": user_data.fullName,
        "email": user_data.email,
        "passwordHash": hashed_password.decode('utf-8'),
        "companySize": user_data.companySize,
        "createdAt": datetime.utcnow(),
        "lastLoginAt": None,
        "isActive": True,
        "consentAccepted": True # Assuming consent is accepted on signup
    }

    # Insert user into database
    result = await db.users.insert_one(user)
    
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not bcrypt.checkpw(form_data.password.encode('utf-8'), user["passwordHash"].encode('utf-8')):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "user_id": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="none",
        secure=True
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logout successful"}

async def get_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Prioritize token from cookie, as that's what the frontend sets
    token_from_cookie = request.cookies.get("access_token")

    if not token_from_cookie:
        # Fallback for other clients, but our primary method is cookie
        if not token:
             raise credentials_exception
    else:
        token = token_from_cookie

    try:
        # The token might be prefixed with "Bearer ", so we remove it
        if token.startswith("Bearer "):
            token = token.replace("Bearer ", "")
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # Pydantic model can be used here for response validation if needed
    current_user["_id"] = str(current_user["_id"])
    return current_user