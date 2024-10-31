from fastapi import APIRouter
from controllers.controller import get_object as controller_get_object, post_object as controller_post_object
from models.object import Object
router = APIRouter()

@router.get("/")
async def get_objects():
    return controller_get_object()

@router.post("/")
async def create_object(obj: Object):
    return controller_post_object(obj)