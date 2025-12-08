from fastapi import FastAPI, Request
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

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # For now, allow all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
        expose_headers=["*"],  # Expose all headers
    )
    
    # Add request logging for debugging
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        # Log incoming request
        print(f"Incoming request: {request.method} {request.url}")
        print(f"Headers: {request.headers}")
        
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to the response
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response

    app.include_router(jobs.router, prefix="/api")
    app.include_router(resume.router, prefix="/api")
    app.include_router(analysis.router, prefix="/api")
    app.include_router(suggestions.router, prefix="/api")
    return app


app = create_app()


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


