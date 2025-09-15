from __future__ import annotations

from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class TopRole(BaseModel):
    category: str
    role: str
    score: float
    skills: List[str]


class UploadAnalyzeResponse(BaseModel):
    resume_id: str
    top_roles: List[TopRole]
    ats_score: Optional[float] = None
    extracted_skills: List[str]
    missing_skills_union: List[str]
    suggestions_short: str


