# Resume Analyzer (React + FastAPI + Sentence-BERT + FAISS + Gemini)

This project analyzes resumes, matches them to roles, computes ATS-like scores, detects skill gaps, and generates polished suggestions.

## Monorepo layout

- `backend/`: FastAPI API + parsing, embeddings, FAISS search, scoring
- `frontend/`: React UI (Vite)
- `vector_store/`: FAISS index and keys
- `deployment/`: docker compose and nginx config

## Quickstart (local)

1) Backend
- Python 3.11+
- `pip install -r backend/requirements.txt`
- `uvicorn backend.main:app --reload`

2) Frontend
- `cd frontend && npm install`
- `npm run dev`

3) Open UI at `http://localhost:5173` (configure `VITE_API_BASE` if needed).

## Docker

- `docker compose -f deployment/docker-compose.yml up --build`

## Notes

- Provide `GEMINI_API_KEY` in env to enable LLM polishing stub integration later.
- Seed roles in `backend/data/jobs.json` and skills in `backend/data/skills.txt`.
- To precompute FAISS from roles: add a simple script to embed role descriptions and write `vector_store/role_index.faiss` and `vector_store/role_keys.json`.


