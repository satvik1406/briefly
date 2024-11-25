import uuid
from models.models import User, Summary
from config.database import users_collection_name, summaries_collection_name
from schema.schema import *
from services.call_to_AI import call_to_AI
from exceptions import ServiceError, NotFoundError, ValidationError
import datetime
import jwt

SECRET_KEY = "your_secret_key"

def create_access_token(data: dict, expires_delta: datetime.timedelta):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.UTC) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def service_create_new_user(user: User):
    existing_user = users_collection_name.find_one({'email': user.email, 'phone': user.phone})
    if existing_user:
        raise ServiceError("User Already Exists", status_code=409)

    user_data = dict(user)
    user_data['_id'] = str(uuid.uuid4())
    users_collection_name.insert_one(user_data)
    return {"message": "User created successfully", "userId": user_data['_id']}

def service_verify_user(obj: User) -> dict:
    user = users_collection_name.find_one({'email': obj.email})
    print(user)
    if user is None:
        raise NotFoundError("Account Does Not Exist")
    
    token_expires = datetime.timedelta(days=30)
    token = create_access_token(
        data={"userId": user['_id']}, expires_delta=token_expires
    )

    user_dict = user_serialiser(user)

    return {'auth_token': token, 'user': user_dict}  

def service_user_summaries(userId: str) -> list:
    try:
        summaries_cursor = summaries_collection_name.find({"userId": userId})
        summaries = list(summaries_cursor)  # Convert cursor to list
        if not summaries:
            return []  # Return empty list if no summaries are found
        return summary_list_serialiser(summaries)
    except Exception as e:
        raise ServiceError(f"Failed to fetch summaries: {str(e)}")

def service_create_summary(summary: Summary):
    summary_data = dict(summary)
    outputData = call_to_AI(summary_data['type'],summary_data['initialData'])
    title = outputData.split("<Title>")[1].split("</Title>")[0]
    Summary = outputData.split("<Summary>")[1].split("</Summary>")[0]
    summary_data['outputData'] = Summary
    summary_data['Title'] = title
    
    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)
    return {"message": "Summary created successfully", "summary_id": summary_data['_id']}
