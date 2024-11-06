from models.models import User, Summary
from config.database import users_collection_name, summaries_collection_name
from schema.schema import *

def service_create_new_user(user: User):
    users_collection_name.insert_one(dict(user))

def service_verify_user(obj: User) -> User:
    user = users_collection_name.find_one({'email':obj.email})
    if user:
        return user_serialiser(user)
    
    return "Account Does Not Exist"

def service_user_summaries(user_id) -> list:
    summaries = summaries_collection_name.find({'user_id':user_id})
    if len(summaries) > 0:
        return summary_list_serialiser(summaries)
    
    return []

def service_create_summary(obj: Summary):
    users_collection_name.insert_one(dict(obj))


    
