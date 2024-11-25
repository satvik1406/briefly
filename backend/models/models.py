import datetime
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict
from pydantic_extra_types import phone_numbers
import uuid

class User(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[phone_numbers.PhoneNumber] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    confirmPassword: Optional[str] = None
    createdAt: datetime.datetime = datetime.datetime.now(datetime.UTC)
    lastLoggedInAt: datetime.datetime = datetime.datetime.now(datetime.UTC)

    @validator('confirmPassword')
    def passwords_match(cls, confirmPassword, values):
        password = values.get('password')
        if password and confirmPassword and confirmPassword != password:
            raise ValueError('Passwords do not match')
        return confirmPassword
    
class Summary(BaseModel):
    userId: str
    type: str
    uploadType: str
    initialData: Optional[str] = None
    filedata: Optional[Dict[str, str]] = None 
    outputData: Optional[str] = None
    createdAt: datetime.datetime = datetime.datetime.now(datetime.UTC)
    updatedAt: datetime.datetime = datetime.datetime.now(datetime.UTC)
