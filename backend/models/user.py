from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    section_id: Optional[str] = None
    academic_year_id: Optional[str] = None
    department_id: Optional[str] = None
    major_id: Optional[str] = None


class BulkStudentCreate(BaseModel):
    students: list[UserCreate]


class DeactivateUser(BaseModel):
    pass
