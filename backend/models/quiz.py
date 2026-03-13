from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class QuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # 'a'|'b'|'c'|'d'
    explanation: Optional[str] = ""
    difficulty: Optional[str] = "medium"


class QuizCreate(BaseModel):
    subject_id: str
    section_id: str
    time_limit: int = 30          # minutes
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    difficulty_level: str = "medium"
    randomize_questions: bool = False
    randomize_options: bool = False
    questions: List[QuestionCreate]


class QuizUpdate(BaseModel):
    subject_id: Optional[str] = None
    section_id: Optional[str] = None
    time_limit: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    difficulty_level: Optional[str] = None
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    questions: Optional[List[QuestionCreate]] = None
    results_published: Optional[bool] = None


class AIGenerateRequest(BaseModel):
    prompt: str  # e.g. "generate 5 questions on machine learning at medium difficulty"


class SubmitQuizRequest(BaseModel):
    answers: dict  # {question_id: "a"|"b"|"c"|"d"}
