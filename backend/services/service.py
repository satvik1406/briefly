import uuid
from models.models import User, Summary
from config.database import users_collection_name, summaries_collection_name, grid_fs
from schema.schema import *
from services.call_to_AI import call_to_AI
from exceptions import ServiceError, NotFoundError, ValidationError
from gridfs import GridFS
import datetime
import jwt
from fastapi import UploadFile

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
    summaries = summaries_collection_name.find({'userId': userId})
    summary_list = summary_list_serialiser(summaries)
    if not summary_list:
        return []
    
    return summary_list

def service_create_summary(summary: Summary):
    summary_data = dict(summary)
    outputData = call_to_AI(summary_data['type'],summary_data['initialData'])
    title = clean(outputData.split("Title")[1].split("Summary")[0])
    Summary = clean(outputData.split("Summary")[1])
    summary_data['outputData'] = Summary
    summary_data['Title'] = title
    
    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)
    return {"message": "Summary created successfully", "summary_id": summary_data['_id']}

def clean(data):
    #  TO DO: Cleanup clean function
    return data.strip().strip('*').strip().strip('*').strip('<').strip('>').strip('/')

async def service_process_file(file: UploadFile, summary: Summary):
    file_contents = await file.read()

    metadata = {
        "filename": file.filename,
        "content_type": file.content_type,
    }

    file_id = grid_fs.put(
        file_contents,
        filename=metadata["filename"],
        content_type=metadata["content_type"]
    )

    metadata["file_id"] = str(file_id)
    summary.filedata = metadata

    summary_data = dict(summary)
    outputData = call_to_AI(summary_data['type'],summary_data['initialData'])
    title = clean(outputData.split("Title")[1].split("Summary")[0])
    Summary = clean(outputData.split("Summary")[1])
    summary_data['outputData'] = Summary
    summary_data['Title'] = title

    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)

    return str(file_id)

def service_delete_summary(summary_id: str):
    summary = summaries_collection_name.find_one({"_id": summary_id})
    if not summary:
        raise ValueError("Summary not found")

    if "filedata" in summary and summary["filedata"]:
        file_id = summary["filedata"].get("file_id") 
        if file_id:
            grid_fs.delete(file_id)

    summaries_collection_name.delete_one({"_id": summary_id})

    return {"message": "Summary deleted successfully"}