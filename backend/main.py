from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

try:
    # Load backend/.env explicitly so it works when running from repo root
    from dotenv import load_dotenv  # type: ignore
    from pathlib import Path
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=str(env_path))
except Exception:
    pass

from backend.routers import resume, jobs, analysis, suggestions


def create_app() -> FastAPI:
    app = FastAPI(title="Resume Analyzer API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(jobs.router, prefix="/api")
    app.include_router(resume.router, prefix="/api")
    app.include_router(analysis.router, prefix="/api")
    app.include_router(suggestions.router, prefix="/api")
    return app


app = create_app()


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


