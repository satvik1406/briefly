from fastapi import APIRouter, HTTPException, status, Depends, Security, Body,  Form, UploadFile, File
from services.service import *
from models.models import User, Summary
from exceptions import *
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from fastapi.responses import StreamingResponse

router = APIRouter()
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/user/create", status_code=status.HTTP_201_CREATED)
async def create_new_user(obj: User):
    try:
        res = service_create_new_user(obj)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/user/verify", status_code=status.HTTP_200_OK)
async def verify_user(obj: User):
    try:
        res = service_verify_user(obj)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.get("/summaries/{userId}", status_code=status.HTTP_200_OK)
async def user_summaries(userId: str, _ = Depends(verify_token)):
    try:
        res = service_user_summaries(userId)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/summary/create", status_code=status.HTTP_201_CREATED)
async def create_summary(obj: Summary = Body(...),  _ = Depends(verify_token)):
    try:
        res = service_create_summary(obj)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)    

@router.post("/summary/upload", status_code=status.HTTP_201_CREATED)
async def create_summary_upload(
    userId: str = Form(...),
    type: str = Form(...),
    uploadType: str = Form(...),
    file: UploadFile = File(...),
    _ = Depends(verify_token)
):
    try:
        summary_data = Summary(
            userId=userId,
            type=type,
            uploadType=uploadType,
        )

        file_id = await service_process_file(file, summary_data)
        
        return {"status": "OK", "file_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/summary/{summary_id}", status_code=status.HTTP_201_CREATED)
async def delete_summary(summary_id: str, _ = Depends(verify_token)):
    try:
        #print(summary_id)
        res = service_delete_summary(summary_id)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
@router.post("/summary/regenerate/{summary_id}", status_code=status.HTTP_201_CREATED)
async def regenerate_summary(
    summary_id: str, 
    feedback: str = Body(...),
    _ = Depends(verify_token)
):
    try:
        res = service_regenrate_summary(summary_id, feedback)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.get("/download/{file_id}")
async def download_file(file_id: str):
    try:
        res = service_download_file(file_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/summary/share", status_code=status.HTTP_200_OK)
async def share_summary(summary_id: str = Body(...), recipient: str = Body(...), _ = Depends(verify_token)):
    """
    Route to share a summary with another user.
    :param summary_id: ID of the summary to be shared
    :param recipient: Recipient username or email
    :return: Success or failure response
    """
    try:
        # Call the service function to share the summary
        res = service_share_summary(summary_id, recipient)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
@router.get("/user/{user_id}/shared-summaries", status_code=status.HTTP_200_OK)
async def get_shared_summaries(user_id: str, _ = Depends(verify_token)):
    """
    Fetch all summaries shared with the specified user.
    """
    try:
        summaries = service_get_shared_summaries(user_id)
        return {"status": "OK", "result": summaries}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch shared summaries")
    
@router.get("/summary/{summary_id}", status_code=status.HTTP_200_OK)
async def get_summary(summary_id: str, _ = Depends(verify_token)):
    try:
        res = service_get_summary(summary_id)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
