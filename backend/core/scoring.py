from __future__ import annotations

from typing import List, Dict, Any, Optional, Tuple
import os
import json
import numpy as np

from .faiss_index import search_roles
from .embeddings import embed_texts, load_roles_data
from backend.models.analysis_model import DetailedAnalysisResponse, GeminiPolishRequest


def _load_role_map() -> Dict[str, Dict[str, Dict[str, Any]]]:
    return load_roles_data()


def compute_overview(
    category: str,
    resume_vector: np.ndarray,
    resume_skills: List[str],
    job_description: Optional[str],
) -> tuple[
    List[Dict[str, Any]],
    Optional[float],
    List[str],
]:
    # FAISS search (with graceful fallback)
    D, I, keys = search_roles(resume_vector, top_k=20)
    key_map: List[str] = keys

    top_candidates: List[Dict[str, Any]] = []
    role_data = _load_role_map()

    used_fallback = False
    if not key_map or I is None or D is None:
        used_fallback = True
    else:
        valid_any = any(idx >= 0 and idx < len(key_map) for idx in I[0].tolist())
        if not valid_any:
            used_fallback = True

    if not used_fallback:
        for idx, score in zip(I[0].tolist(), D[0].tolist()):
            if idx < 0 or idx >= len(key_map):
                continue
            key = key_map[idx]
            cat, role = key.split("::", 1) if "::" in key else ("", key)
            if cat != category:
                continue
            skills = role_data.get(cat, {}).get(role, {}).get("skills", [])
            top_candidates.append({
                "category": cat,
                "role": role,
                "score": round(float(score) * 100.0, 1),
                "skills": skills[:7],
            })
            if len(top_candidates) >= 3:
                break
    else:
        # Fallback: compute role embeddings on the fly and rank by cosine similarity
        role_texts: List[str] = []
        key_list: List[str] = []
        for cat, roles in role_data.items():
            for role, meta in roles.items():
                desc = meta.get("description") or role
                role_texts.append(f"{cat}::{role} — {desc}")
                key_list.append(f"{cat}::{role}")
        if role_texts:
            vecs = embed_texts(role_texts)
            # L2 normalize
            norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-12
            vecs = (vecs / norms).astype(np.float32)
            sims = (vecs @ resume_vector.reshape(-1, 1)).ravel()
            order = np.argsort(-sims)
            for idx in order:
                key = key_list[int(idx)]
                sim = float(sims[int(idx)])
                cat, role = key.split("::", 1)
                if cat != category:
                    continue
                skills = role_data.get(cat, {}).get(role, {}).get("skills", [])
                top_candidates.append({
                    "category": cat,
                    "role": role,
                    "score": round(sim * 100.0, 1),
                    "skills": skills[:7],
                })
                if len(top_candidates) >= 3:
                    break

    # Missing skills union across top roles
    missing_union: set[str] = set()
    for item in top_candidates:
        skills = set(s.lower() for s in item.get("skills", []))
        present = skills.intersection(set(resume_skills))
        missing = skills - present
        missing_union.update(missing)

    ats_score: Optional[float] = None
    if job_description:
        jd_vec = embed_texts([job_description])[0]
        # normalize
        jd_vec = (jd_vec / (np.linalg.norm(jd_vec) + 1e-12)).astype(np.float32)
        sim = float(np.dot(resume_vector, jd_vec))
        ats_score = round(sim * 100.0, 1)

    return top_candidates, ats_score, sorted(missing_union)


def generate_short_suggestions(missing_skills_union: List[str], ats_score: Optional[float]) -> str:
    base = ""
    if missing_skills_union:
        base += f"Missing skills: {', '.join(missing_skills_union)}. "
    if ats_score is not None:
        base += f"ATS similarity: {ats_score}%. "
    base += "Make bullets measurable."
    return base.strip()


def run_detailed_analysis(
    choice: Dict[str, Any],
    resume_vector: np.ndarray,
    resume_preview: str,
) -> DetailedAnalysisResponse:
    # Build a synthetic report without LLM for MVP
    role_score = None
    strengths = ["Strong foundational skills", "Relevant project experience"]
    weaknesses = ["Missing key role-specific tools", "Few quantified achievements"]
    actionables = [
        "Add 2 quantified metrics to experience bullets",
        "Include missing tools in skills section if applicable",
        "Add one project demonstrating deployment or ML workflow",
        "Refactor bullets to start with action verbs",
    ]
    example_bullets = [
        "Built REST APIs and optimized queries, reducing latency by 25%.",
        "Containerized service with Docker and deployed to Kubernetes.",
    ]
    final_score = 80.0
    return DetailedAnalysisResponse(
        final_score=final_score,
        strengths=strengths,
        weaknesses=weaknesses,
        actionable_recs=actionables,
        example_bullets=example_bullets,
        llm_polished_text="",
    )


def build_gemini_prompt(payload: GeminiPolishRequest) -> str:
    role = payload.role
    ats = payload.ats_score if payload.ats_score is not None else "N/A"
    role_score = payload.role_score if payload.role_score is not None else "N/A"
    matched = ", ".join(payload.matched or [])
    missing = ", ".join(payload.missing or [])
    resume_snip = payload.resume_snippet or ""
    job_snip = payload.job_snippet or ""
    return (
        "You are a career coach. Given:\n"
        f"- Role: {role}\n"
        f"- ATS score: {ats}\n"
        f"- Role match score: {role_score}\n"
        f"- Matched skills: {matched}\n"
        f"- Missing skills: {missing}\n"
        f"- Resume preview: {resume_snip}\n"
        f"- Job preview: {job_snip}\n\n"
        "Output:\n"
        "1) Strengths (2–3 bullets)\n"
        "2) Weaknesses (2–3 bullets)\n"
        "3) 4 concrete improvement steps\n"
        "4) 2 example resume bullets\n"
        "Tone: concise, professional, encouraging."
    )


def call_gemini(prompt: str) -> str:
    # Placeholder for real Gemini API call (to be wired with API key)
    # Keep simple deterministic response for now
    return (
        "Strengths:\n- Clear technical background\n- Relevant tools listed\n\n"
        "Weaknesses:\n- Missing role-specific tools\n- Limited metrics\n\n"
        "Actions:\n- Add 2 quantified metrics\n- Include missing tools\n- Add a project\n- Improve bullet phrasing\n\n"
        "Examples:\n- Reduced latency by 25%...\n- Deployed via Kubernetes..."
    )


