from __future__ import annotations

import os
import json
import numpy as np


def main():
    # Lazy import so this script can run in the same venv
    from sentence_transformers import SentenceTransformer
    import faiss  # type: ignore

    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    data_path = os.path.join(root, "backend", "data", "jobs.json")
    out_dir = os.path.join(root, "vector_store")
    os.makedirs(out_dir, exist_ok=True)

    with open(data_path, "r", encoding="utf-8") as f:
        jobs = json.load(f)

    role_texts = []
    role_keys = []
    for cat, roles in jobs.items():
        for role, meta in roles.items():
            desc = meta.get("description") or role
            role_texts.append(f"{cat}::{role} — {desc}")
            role_keys.append(f"{cat}::{role}")

    if not role_texts:
        print("No roles found in jobs.json")
        return

    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    vecs = model.encode(role_texts, convert_to_numpy=True)
    vecs = vecs.astype(np.float32)
    # L2 normalize
    norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-12
    vecs = (vecs / norms).astype(np.float32)

    d = vecs.shape[1]
    index = faiss.IndexFlatIP(d)
    index.add(vecs)

    idx_path = os.path.join(out_dir, "role_index.faiss")
    keys_path = os.path.join(out_dir, "role_keys.json")

    faiss.write_index(index, idx_path)
    with open(keys_path, "w", encoding="utf-8") as f:
        json.dump(role_keys, f, ensure_ascii=False, indent=2)

    print(f"Wrote {idx_path} and {keys_path} ({len(role_keys)} roles)")


if __name__ == "__main__":
    main()


