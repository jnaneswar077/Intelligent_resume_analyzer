from __future__ import annotations

from typing import List, Tuple, Dict, Any, Optional
import os
import json
import numpy as np

_model = None


def _load_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer  # type: ignore
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def load_roles_data() -> Dict[str, Any]:
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "jobs.json")
    if not os.path.exists(data_path):
        return {}
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def embed_texts(texts: List[str]) -> np.ndarray:
    model = _load_model()
    vectors = model.encode(texts, convert_to_numpy=True, normalize_embeddings=False)
    vectors = vectors.astype(np.float32)
    return vectors


def _mean_pool(vectors: np.ndarray) -> np.ndarray:
    if vectors.ndim == 1:
        return vectors
    return vectors.mean(axis=0)


def embed_resume_text(text: str) -> Tuple[np.ndarray, str]:
    # naive chunking by sentences/periods for MVP
    sentences = [s.strip() for s in text.split(".") if s.strip()]

    chunks: List[str] = []
    buf: List[str] = []
    token_estimate = 0
    for s in sentences:
        token_estimate += max(1, len(s.split()) // 1)
        buf.append(s)
        if token_estimate >= 250:
            chunks.append(". ".join(buf))
            buf = []
            token_estimate = 0
    if buf:
        chunks.append(". ".join(buf))
    if not chunks:
        chunks = [text]
    vecs = embed_texts(chunks)
    pooled = _mean_pool(vecs)
    # L2 normalize for cosine via dot
    norm = np.linalg.norm(pooled) + 1e-12
    pooled = (pooled / norm).astype(np.float32)
    preview = " ".join(text.split()[:300])
    return pooled, preview


_CACHE: Dict[str, Tuple[np.ndarray, str]] = {}


def cache_resume_vector(vec: np.ndarray, preview: str) -> str:
    resume_id = f"r_{abs(hash(preview)) % (10**8):08d}"
    _CACHE[resume_id] = (vec, preview)
    return resume_id


def load_cached_resume_vector(resume_id: str) -> Tuple[Optional[np.ndarray], Optional[str]]:
    pair = _CACHE.get(resume_id)
    if not pair:
        return None, None
    return pair
