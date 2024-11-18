from fastapi import APIRouter, HTTPException, status, Depends, Security, Body
from services.service import *
from models.models import User, Summary
from exceptions import *
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

router = APIRouter()
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/auth/user/create", status_code=status.HTTP_201_CREATED)
async def create_new_user(obj: User):
    try:
        res = service_create_new_user(obj)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/auth/user/verify", status_code=status.HTTP_200_OK)
async def verify_user(obj: User):
    try:
        res = service_verify_user(obj)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.get("/user/{userId}/summaries", status_code=status.HTTP_200_OK)
async def user_summaries(userId: str=Depends(verify_token)):
    try:
        res = service_user_summaries(userId)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/user/create/summary", status_code=status.HTTP_201_CREATED)
async def create_summary(obj: Summary = Body(...),  _ = Depends(verify_token)):
    try:
        print(obj)
        res = service_create_summary(obj)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
