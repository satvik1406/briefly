from models.models import User
from config.database import user_collection_name, collection_name
from schema.schema import list_serialiser

def controller_create_new_user(user: User):
    user_collection_name.insert_one(dict(user))

def controller_verify_user(obj: User) -> User:
    user = collection_name.find_one({'email':obj.email})
    return user