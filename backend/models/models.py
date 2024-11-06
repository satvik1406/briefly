import datetime
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from pydantic_extra_types import phone_numbers
import uuid

class User(BaseModel):
    _id: str = str(uuid.uuid4()) 
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[phone_numbers.PhoneNumber] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    confirmPassword: Optional[str] = None
    createdAt: Optional[datetime.datetime] = None
    lastLoggedInAt: Optional[datetime.datetime] = None

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
    outputData: Optional[str] = None
    createdAt: Optional[datetime.datetime] = None
    updatedAt: Optional[datetime.datetime] = None
