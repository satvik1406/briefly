from fastapi import APIRouter, HTTPException, status, Depends, Security, Body,  Form, UploadFile, File
from services.service import *
from models.models import User, Summary
from exceptions import *
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

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
async def create_summary(summary_id: str, _ = Depends(verify_token)):
    try:
        print(summary_id)
        res = service_delete_summary(summary_id)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
@router.get("/download/{file_id}")
async def download_file(file_id: str):
    try:
        grid_out = grid_fs.get(ObjectId(file_id))
        if not grid_out:
            raise HTTPException(status_code=404, detail="File not found")

        # Stream the file back to the client
        return StreamingResponse(
            grid_out, 
            media_type=grid_out.content_type,
            headers={"Content-Disposition": f"attachment; filename={grid_out.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))