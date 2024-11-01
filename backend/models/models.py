from pydantic import BaseModel
from pydantic_extra_types import phone_numbers

class User(BaseModel):
    firstName: str
    lastName: str
    phoneNumber: phone_numbers.PhoneNumber
    email: str
    password: str