from __future__ import annotations

from pydantic import BaseModel
from typing import Dict, Any


class RolesResponse(BaseModel):
    data: Dict[str, Any]


