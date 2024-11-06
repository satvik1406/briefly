from fastapi import APIRouter
from services.service import *
from models.models import User, Summary
router = APIRouter()

@router.post("/auth/user/create")
async def create_new_user(obj: User):
    res = service_create_new_user(obj)
    return {"status": "OK", "result": res}

@router.post("/auth/user/verify")
async def verify_user(obj: User):
    res = service_verify_user(obj)
    return {"status": "OK", "result": res}

@router.get("/user/{user_id}/summaries")
async def user_summaries(user_id):
    res = service_user_summaries(user_id)
    return {"status": "OK", "result": res}

@router.post("/user/create/summary")
async def user_summaries(obj: Summary):
    res = service_create_summary(obj)
    return {"status": "OK", "result": res}