from pydantic import BaseModel
from typing import Optional


class MajorBase(BaseModel):
    name: str

class MajorCreate(MajorBase):
    pass

class MajorUpdate(MajorBase):
    pass


class DepartmentBase(BaseModel):
    name: str
    major_id: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    pass


class AcademicYearBase(BaseModel):
    year_number: int
    department_id: str

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearUpdate(AcademicYearBase):
    pass


class TermBase(BaseModel):
    term_number: int
    academic_year_id: str

class TermCreate(TermBase):
    pass

class TermUpdate(TermBase):
    pass


class SubjectBase(BaseModel):
    name: str
    term_id: str

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(SubjectBase):
    pass


class SectionBase(BaseModel):
    name: str
    academic_year_id: str

class SectionCreate(SectionBase):
    pass

class SectionUpdate(SectionBase):
    pass


class FacultyAssignmentCreate(BaseModel):
    faculty_id: str
    subject_id: str
    section_id: str
