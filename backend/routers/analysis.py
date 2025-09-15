from fastapi import APIRouter, HTTPException
from backend.models.analysis_model import DetailedAnalysisRequest, DetailedAnalysisResponse
from backend.core import scoring, embeddings


router = APIRouter(prefix="/detailed_analysis", tags=["analysis"]) 


@router.post("")
async def detailed_analysis(payload: DetailedAnalysisRequest) -> DetailedAnalysisResponse:
    resume_vec, resume_preview = embeddings.load_cached_resume_vector(payload.resume_id)
    if resume_vec is None:
        raise HTTPException(status_code=404, detail="resume_id not found")

    report = scoring.run_detailed_analysis(
        choice=payload.choice,
        resume_vector=resume_vec,
        resume_preview=resume_preview,
    )
    return report


