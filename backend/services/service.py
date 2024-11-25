import uuid
from models.models import User, Summary
from config.database import users_collection_name, summaries_collection_name
from schema.schema import *
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
            raise NotFoundError("Recipient not found")

        # Create a record in the shared summaries (if necessary)
        shared_record = {
            "_id": str(uuid.uuid4()),
            "summary_id": summary_id,
            "sender_id": summary["userId"],
            "recipient_id": recipient_user["_id"],
            "shared_at": datetime.datetime.utcnow(),
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
