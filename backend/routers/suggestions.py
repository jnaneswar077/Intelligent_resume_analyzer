from fastapi import APIRouter
from backend.models.analysis_model import GeminiPolishRequest, GeminiPolishResponse
from backend.core.scoring import build_gemini_prompt, call_gemini


router = APIRouter(prefix="/suggestions", tags=["suggestions"]) 


@router.post("/polish")
async def polish(payload: GeminiPolishRequest) -> GeminiPolishResponse:
    prompt = build_gemini_prompt(payload)
    output = call_gemini(prompt)
    return GeminiPolishResponse(text=output)


