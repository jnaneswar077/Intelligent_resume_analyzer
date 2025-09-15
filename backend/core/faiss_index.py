from __future__ import annotations

from typing import List, Tuple
import os
import json
import numpy as np

_faiss_index = None
_role_keys: List[str] = []


def _load_faiss():
    global _faiss_index
    if _faiss_index is not None:
        return _faiss_index
    try:
        import faiss  # type: ignore
    except Exception as ex:
        raise RuntimeError("FAISS not installed. Add faiss-cpu to requirements.") from ex
    base = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "vector_store")
    base = os.path.abspath(base)
    idx_path = os.path.join(base, "role_index.faiss")
    # Create empty flat index for 384-dim as default if file missing or empty
    if not os.path.exists(idx_path) or os.path.getsize(idx_path) == 0:
        _faiss_index = faiss.IndexFlatIP(384)
        return _faiss_index
    # Try reading index; if it fails, fall back to empty index
    try:
        _faiss_index = faiss.read_index(idx_path)
    except Exception:
        _faiss_index = faiss.IndexFlatIP(384)
    return _faiss_index


def _load_role_keys() -> List[str]:
    global _role_keys
    if _role_keys:
        return _role_keys
    base = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "vector_store")
    base = os.path.abspath(base)
    keys_path = os.path.join(base, "role_keys.json")
    if os.path.exists(keys_path):
        with open(keys_path, "r", encoding="utf-8") as f:
            _role_keys = json.load(f)
    return _role_keys


def search_roles(resume_vec: np.ndarray, top_k: int = 10) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    faiss_index = _load_faiss()
    keys = _load_role_keys()
    if resume_vec.ndim == 1:
        q = resume_vec.reshape(1, -1)
    else:
        q = resume_vec
    try:
        import faiss  # type: ignore
    except Exception:
        raise RuntimeError("FAISS import failed.")
    D, I = faiss_index.search(q, top_k)
    return D, I, keys


