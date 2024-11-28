import uuid
from models.models import User, Summary
from config.database import users_collection_name, summaries_collection_name, grid_fs, shared_summaries_collection_name
from schema.schema import *
from services.call_to_AI import call_to_AI, regenerate_feedback
from exceptions import ServiceError, NotFoundError, ValidationError
from gridfs import GridFS
from PyPDF2 import PdfReader
import datetime
import jwt
from fastapi import UploadFile
import re

SECRET_KEY = "your_secret_key"

def create_access_token(data: dict, expires_delta: datetime.timedelta):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.UTC) + expires_delta
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
    title = clean(outputData.split("Title:")[1].split("Summary:")[0])
    Summary = clean(outputData.split("Summary:")[1])
    summary_data['outputData'] = Summary
    summary_data['title'] = title
    
    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)
    return {"message": "Summary created successfully", "summary_id": summary_data['_id']}

def service_share_summary(summary_id: str, recipient: str):
    """
    Shares a summary with another user.
    :param summary_id: ID of the summary to share
    :param recipient: Recipient's email or username
    :return: Success or failure message
    """
    try:
        # Check if the summary exists
        summary = summaries_collection_name.find_one({"_id": summary_id})
        if not summary:
            raise NotFoundError("Summary not found")

        # Check if the recipient exists
        recipient_user = users_collection_name.find_one({"email": recipient})
        if not recipient_user:
            raise NotFoundError("The recipient must be a registered user of Briefly.")

        # Create a record in the shared summaries (if necessary)
        shared_record = {
            "_id": str(uuid.uuid4()),
            "summary_id": summary_id,
            "sender_id": summary["userId"],
            "recipient_id": recipient_user["_id"],
            "shared_at": datetime.datetime.now(),
        }

        # Assuming you have a collection for shared summaries
        shared_summaries_collection = summaries_collection_name.database["shared_summaries"]
        shared_summaries_collection.insert_one(shared_record)

        # Return success message
        return {"message": f"Summary shared successfully with {recipient}"}

    except NotFoundError as e:
        raise NotFoundError(e.detail)
    except Exception as e:
        raise ServiceError(f"Failed to share summary: {str(e)}")
    
def service_get_shared_summaries(user_id: str):
    """
    Fetch summaries shared with a specific user.
    """
    try:
        # Query shared summaries for the given user
        shared_records = shared_summaries_collection_name.find({"recipient_id": user_id})
        shared_summaries = list(shared_records)

        if not shared_summaries:
            raise NotFoundError("No summaries shared with this user")

        # Fetch summary details and include sharedBy information
        result = []
        for record in shared_summaries:
            summary_id = record.get("summary_id")
            sender_id = record.get("sender_id")

            # Fetch summary details
            summary = summaries_collection_name.find_one({"_id": summary_id})
            if not summary:
                continue

            # Fetch sender details
            sender = users_collection_name.find_one({"_id": sender_id})

            # Add summary with additional details
            result.append(shared_summary_serialiser(record, summary, sender))

        return result

    except Exception as e:
        raise NotFoundError(f"Failed to fetch shared summaries: {str(e)}")

def clean(data):
    # Remove special characters from the start and end of the string
    return re.sub(r'^[^\w]+|[^\w]+$', '', data)

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

    initialData = extract_text_from_pdf(file)

    summary_data = dict(summary)
    outputData = call_to_AI(summary_data['type'], initialData)
    title = clean(outputData.split("Title:")[1].split("Summary:")[0])
    Summary = clean(outputData.split("Summary:")[1])
    summary_data['outputData'] = Summary
    summary_data['title'] = title

    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)

    return {"message": "Summary created successfully", "summary_id": summary_data['_id'], "file_id": str(file_id)}

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

def service_regenrate_summary(summary_id: str, feedback: str):
    summary = summaries_collection_name.find_one({"_id": summary_id})
    if not summary:
        raise NotFoundError("Summary not found")

    summary_data = dict(summary)
    outputData = regenerate_feedback(summary_data, feedback)
    title = clean(outputData.split("Title:")[1].split("Summary:")[0])
    Summary = clean(outputData.split("Summary:")[1])
    summary_data['outputData'] = Summary
    summary_data['Title'] = title
    summaries_collection_name.update_one({"_id": summary_id}, {"$set": summary_data})
    return {"message": "Summary regenerated successfully"}

# service_regenrate_summary("116cc127-17eb-4801-9c2d-ac6a044b05fa", "Write a shorter summary")

def extract_text_from_pdf(uploaded_file: UploadFile):
    text = ""
    pdf_reader = PdfReader(uploaded_file.file)
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text()
    return text