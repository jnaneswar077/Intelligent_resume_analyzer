from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from backend.core import parser, preprocessing, embeddings, scoring
from backend.models.resume_model import UploadAnalyzeResponse


router = APIRouter(prefix="/upload_and_analyze", tags=["resume"]) 


@router.post("")
async def upload_and_analyze(
    file: UploadFile = File(...),
    category: str = Form(...),
    selected_role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
) -> UploadAnalyzeResponse:
    if file.content_type not in ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        # fallback: accept any; we'll still try to decode
        pass

    content = await file.read()
    resume_text = parser.parse_resume_bytes(content, filename=file.filename or "uploaded")
    cleaned_text = preprocessing.clean_text(resume_text)

    extracted_skills = preprocessing.extract_skills(cleaned_text)

    # Embed resume text
    resume_vec, preview = embeddings.embed_resume_text(cleaned_text)

    # Compute top roles and ATS if JD provided
    top_roles, ats_score, missing_skills_union = scoring.compute_overview(
        category=category,
        resume_vector=resume_vec,
        resume_skills=extracted_skills,
        job_description=job_description,
    )

    suggestions_short = scoring.generate_short_suggestions(missing_skills_union, ats_score)

    return UploadAnalyzeResponse(
        resume_id=embeddings.cache_resume_vector(resume_vec, preview),
        top_roles=top_roles,
        ats_score=ats_score,
        extracted_skills=extracted_skills,
        missing_skills_union=missing_skills_union,
        suggestions_short=suggestions_short,
    )


