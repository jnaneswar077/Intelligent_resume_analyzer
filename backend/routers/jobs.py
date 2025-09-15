from fastapi import APIRouter
from typing import Dict, Any
from backend.core.embeddings import load_roles_data


router = APIRouter(prefix="/roles", tags=["jobs"]) 


@router.get("")
async def get_roles() -> Dict[str, Any]:
    return load_roles_data()


