from fastapi import APIRouter, HTTPException, status, Depends, Security, Body,  Form, UploadFile, File
from services.service import *
from models.models import User, Summary
from exceptions import *
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from fastapi.responses import StreamingResponse

router = APIRouter()
security = HTTPBearer()

# JWT token verification middleware
def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# User Management Routes
@router.post("/user/create", status_code=status.HTTP_201_CREATED)
async def create_new_user(obj: User):
    """Creates a new user account"""
    try:
        res = service_create_new_user(obj)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/user/verify", status_code=status.HTTP_200_OK)
async def verify_user(obj: User):
    """Authenticates user and returns JWT token"""
    try:
        res = service_verify_user(obj)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# Summary Management Routes
@router.get("/summaries/{userId}", status_code=status.HTTP_200_OK)
async def user_summaries(userId: str, _ = Depends(verify_token)):
    """Retrieves all summaries for a given user"""
    try:
        res = service_user_summaries(userId)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/summary/create", status_code=status.HTTP_201_CREATED)
async def create_summary(obj: Summary = Body(...), _ = Depends(verify_token)):
    """Creates a new summary from text input"""
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
    """Creates a new summary from uploaded file"""
    try:
        summary_data = Summary(
            userId=userId,
            type=type,
            uploadType=uploadType,
        )
        res = await service_process_file(file, summary_data)
        return {"status": "OK", "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Summary Operations Routes    
@router.delete("/summary/{summary_id}", status_code=status.HTTP_201_CREATED)
async def delete_summary(summary_id: str, _ = Depends(verify_token)):
    """Deletes a specific summary and its associated file"""
    try:
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
    """Regenerates a summary based on user feedback"""
    try:
        res = service_regenrate_summary(summary_id, feedback)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# File Operations Routes
@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """Streams the original file for download"""
    try:
        res = service_download_file(file_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Sharing Routes    
@router.post("/summary/share", status_code=status.HTTP_200_OK)
async def share_summary(summary_id: str = Body(...), recipient: str = Body(...), _ = Depends(verify_token)):
    """Shares a summary with another user via email"""
    try:
        res = service_share_summary(summary_id, recipient)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
@router.get("/user/{user_id}/shared-summaries", status_code=status.HTTP_200_OK)
async def get_shared_summaries(user_id: str, _ = Depends(verify_token)):
    """Retrieves all summaries shared with the user"""
    try:
        summaries = service_get_shared_summaries(user_id)
        return {"status": "OK", "result": summaries}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch shared summaries")
    
@router.get("/summary/{summary_id}", status_code=status.HTTP_200_OK)
async def get_summary(summary_id: str, _ = Depends(verify_token)):
    """Retrieves a specific summary by ID"""
    try:
        res = service_get_summary(summary_id)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
