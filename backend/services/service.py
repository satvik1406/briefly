import uuid
from models.models import User, Summary
from config.database import users_collection_name, summaries_collection_name, grid_fs, shared_summaries_collection_name
from schema.schema import *
from exceptions import ServiceError, NotFoundError, ValidationError
from gridfs import GridFS
from PyPDF2 import PdfReader
import json
import datetime
import jwt
from fastapi import HTTPException, UploadFile
import re
from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from bson import ObjectId
from mistralai import Mistral
from config.database import grid_fs
from bson import ObjectId
from io import BytesIO
from docx import Document

SECRET_KEY = "your_secret_key"
api_key = "UvZmnaaEx8y6tAYTjunw9dNDyXGe11qD"
prompts = {
    'code': "You are a code summarisation tool. Understand the given code and output the detailed summary of the code.",
    'research': "You are a research article summarisation tool. Go through the research article given to you and give a detailed summary. Make sure your summary covers motivation, methodology, results and future improvements.",
    'documentation': "You are a summarisation tool. You will be given a piece of text that you should summarize, make sure to cover as much content as you can. Be as technical as you can be."
}

def create_access_token(data: dict, expires_delta: datetime.timedelta):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc
                                   ) + expires_delta
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
    if user is None:
        raise NotFoundError("Account Does Not Exist")
    
    token_expires = datetime.timedelta(days=30)
    token = create_access_token(
        data={"userId": user['_id']}, expires_delta=token_expires
    )

    user_dict = user_serialiser(user)

    return {'auth_token': token, 'user': user_dict}  

def service_user_summaries(userId: str) -> list:
    summaries = summaries_collection_name.find({'userId': userId}).sort("createdAt", -1)
    summary_list = summary_list_serialiser(summaries)
    if not summary_list:
        return []
    
    return summary_list

def service_create_summary(summary: Summary):
    summary_data = dict(summary)
    outputData = call_to_AI(summary_data['type'],summary_data['initialData'])
    summary_data['outputData'] = outputData['Summary']
    summary_data['title'] = outputData['Title']   
    
    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)
    return {"message": "Summary created successfully", "summary_id": summary_data['_id']}

def extract_text_from_file(file: UploadFile, contents: bytes) -> str:
    """Extract text from various file types."""
    try:
        if file.filename.endswith('.pdf'):
            return extract_text_from_pdf(file)
        elif file.filename.endswith(('.txt', '.py', '.js', '.html', '.css', '.json', '.md')):
            return contents.decode('utf-8')
        elif file.filename.endswith(('.doc', '.docx')):
            doc = Document(BytesIO(contents))
            return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
        else:
            return contents.decode('utf-8')
    except UnicodeDecodeError:
        # Try different encodings if UTF-8 fails
        raise ServiceError("Unable to decode file contents", status_code=400)

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
    initialData = extract_text_from_file(file, file_contents)
    summary_data = dict(summary)
    outputData = call_to_AI(summary_data['type'], initialData)
    summary_data['outputData'] = outputData['Summary']
    summary_data['title'] = outputData['Title']  

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
    summary_data['outputData'] = outputData['Summary']
    summary_data['title'] = outputData['Title']
    summaries_collection_name.update_one({"_id": summary_id}, {"$set": summary_data})
    return {"message": "Summary regenerated successfully"}

def extract_text_from_pdf(uploaded_file: UploadFile):
    text = ""
    pdf_reader = PdfReader(uploaded_file.file)
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text()
    return text

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

        # Check if the sender and recipient are the same
        if summary["userId"] == recipient_user["_id"]:
            raise ServiceError("You cannot share a summary with yourself.")

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
        shared_records = shared_summaries_collection_name.find({"recipient_id": user_id}).sort("shared_at", -1)
        
        result = []
        for shared_record in shared_records:
            # Get the original summary
            summary = summaries_collection_name.find_one({"_id": shared_record["summary_id"]})
            if not summary:
                continue

            # Get the sender's information
            sender = users_collection_name.find_one({"_id": shared_record["sender_id"]})
            if not sender:
                continue

            # Use the serializer to format the data
            shared_summary = shared_summary_serialiser(shared_record, summary, sender)
            result.append(shared_summary)

        return result

    except Exception as e:
        raise ServiceError(f"Failed to fetch shared summaries: {str(e)}")

def service_get_summary(summary_id: str):
    summary = summaries_collection_name.find_one({"_id": summary_id})
    if not summary:
        raise ValueError("Summary not found")
    summary = summary_serialiser(summary)
    return summary

def service_download_file(file_id: str):
    # Fetch the file from GridFS
    try:
        grid_out = grid_fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    # Stream the file in chunks
    async def file_iterator():
        while chunk := grid_out.read(1024 * 1024):  # 1 MB chunks
            yield chunk

    # Return the streamed file response
    return StreamingResponse(
        file_iterator(),
        media_type=grid_out.content_type,
            headers={"Content-Disposition": f"attachment; filename={grid_out.filename}"}
    )

def clean(data):
    # Remove special characters from the start and end of the string
    return re.sub(r'^[^\w]+|[^\w]+$', '', data)

def call_to_AI(inputType, inputData):
    model = "open-mistral-nemo"
    if inputType == "code":
        model = "open-codestral-mamba"
    client = Mistral(api_key=api_key)
    chat_response = client.chat.complete(
        model = model,
        messages = [
            {
                "role": "system",
                "content": prompts[inputType],
            },
            {
                "role": "system",
                "content":'''
                This is an example showing how the format of the output should be, use this only as an example and do not fetch any data from this into your output. 

                <Example_1>
                Input:
                "
                    print('Hello World')
                "
                Output:
                "
                {
                    "Title": "Printing Hello World in Python",
                    "Summary": "
                    The output of the code will be "Hello World", which is printed to the console.
                    The 'print' function in Python is used to output the specified message to the screen. 
                    In this case, the message is "Hello World". The code simply calls this function with the string "Hello World" as its argument. 
                    When executed, the program will print this string to the console
                    "
                }
                "
                <\Example_1>

                Follow the format specified in the above example.
                ''',
            },
            {
                "role": "user",
                "content": inputData,
            },
            {
                "role": "system",
                "content":"Return the Title and Summary in short json object.",
            }
        ],
        response_format = {
          "type": "json_object",
        }
    )
    outputData_string = chat_response.choices[0].message.content 
    try:
        outputData = json.loads(outputData_string, strict=False)
    except json.JSONDecodeError:
        # If JSON parsing fails, extract title and summary manually
        outputData = {}  # Initialize empty dict
        try:
            title = clean(outputData_string.split("Title:")[1].split("Summary:")[0])
            summary = clean(outputData_string.split("Summary:")[1])
            outputData['Title'] = title
            outputData['Summary'] = summary
        except IndexError as e:
            raise ValueError("Failed to parse string format: Missing Title or Summary sections") from e

    return outputData

def regenerate_feedback(summary_data, feedback):
    inputType = summary_data['type']
    model = "open-mistral-nemo"
    if  inputType == "code":
        model = "open-codestral-mamba"

    initialData = summary_data['initialData']
    if initialData is None and summary_data['filedata'] is not None:
        filedata = summary_data['filedata']
        file = grid_fs.get(ObjectId(filedata['file_id']))
        file_contents = file.read()
        
        # Create a temporary UploadFile-like object with a file-like interface
        class TempUploadFile:
            def __init__(self, filename, contents):
                self.filename = filename
                self.file = BytesIO(contents)
                
        temp_file = TempUploadFile(filedata['filename'], file_contents)
        initialData = extract_text_from_file(temp_file, file_contents)

    client = Mistral(api_key=api_key)
    chat_response = client.chat.complete(
        model = model,
        messages = [
            {
                "role": "system",
                "content": prompts[inputType],
            },
            {
                "role": "system",
                "content":'''
                This is an example showing how the format of the output should be, use this ONLY as an example and DO NOT fetch any data from this into your output. 
                <Example_1>
                Input:
                "
                    print('Hello World')
                "
                Output:
                "
                {
                    "Title": "Printing Hello World in Python",
                    "Summary": "
                    The output of the code will be "Hello World", which is printed to the console.
                    The 'print' function in Python is used to output the specified message to the screen. 
                    In this case, the message is "Hello World". The code simply calls this function with the string "Hello World" as its argument. 
                    When executed, the program will print this string to the console
                    "
                }
                "
                <\Example_1>

                Follow the format specified in the above example.
                ''',
            },
            {
                "role": "user",
                "content": initialData,
            },
            {
                "role": "assistant",
                "content": summary_data['outputData'],
            },
            {
                "role": "user",
                "content": feedback
            },
            {
                "role": "system",
                "content": "Regenerate the summary based on the feedback provided by the user. Return the Title and Summary in short json object."
            }
        ],
        response_format = {
          "type": "json_object",
        }
    )
    outputData_string = chat_response.choices[0].message.content 

    try:
        outputData = json.loads(outputData_string, strict=False)
    except json.JSONDecodeError:
        # If JSON parsing fails, extract title and summary manually
        outputData = {}  # Initialize empty dict
        try:
            summary = clean(outputData_string.split("Summary:")[1])
            outputData['Summary'] = summary
        except IndexError as e:
            raise ValueError("Failed to parse string format: Missing Title or Summary sections") from e
    outputData['Title'] = summary_data['title']
    return outputData