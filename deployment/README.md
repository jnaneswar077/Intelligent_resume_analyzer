# Deployment notes

- Backend runs on port 8000, frontend served by nginx on 5173 via docker-compose.
- Ensure `vector_store/role_index.faiss` and `vector_store/role_keys.json` exist (optional on first run).
- Set `GEMINI_API_KEY` in environment for suggestions polishing.

## Run

```bash
docker compose -f deployment/docker-compose.yml up --build
```

Then open http://localhost:5173


