from __future__ import annotations

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class DetailedChoice(BaseModel):
    # type: "JD" | {category, role}
    type: str
    category: Optional[str] = None
    role: Optional[str] = None


class DetailedAnalysisRequest(BaseModel):
    resume_id: str
    choice: Dict[str, Any]


class DetailedAnalysisResponse(BaseModel):
    final_score: float
    strengths: List[str]
    weaknesses: List[str]
    actionable_recs: List[str]
    example_bullets: List[str]
    llm_polished_text: str
    gemini_timestamp: Optional[str] = None  # Only set when response is from Gemini


class GeminiPolishRequest(BaseModel):
    role: str
    ats_score: Optional[float] = None
    role_score: Optional[float] = None
    matched: Optional[List[str]] = None
    missing: Optional[List[str]] = None
    resume_snippet: Optional[str] = None
    job_snippet: Optional[str] = None


class GeminiPolishResponse(BaseModel):
    text: str


