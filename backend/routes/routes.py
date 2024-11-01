from fastapi import APIRouter
from controllers.controller import controller_create_new_user, controller_verify_user
from models.models import User
router = APIRouter()

@router.post("/auth/user/create")
async def create_new_user(obj: User):
    return controller_create_new_user(obj)

@router.post("/auth/user/verify")
async def verify_user(obj: User):
    return controller_verify_user(obj)