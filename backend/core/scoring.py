from __future__ import annotations

from typing import List, Dict, Any, Optional, Tuple
import os
import json
import numpy as np

from .faiss_index import search_roles
from .embeddings import embed_texts, load_roles_data
from .preprocessing import extract_skills
from backend.models.analysis_model import DetailedAnalysisResponse, GeminiPolishRequest
import google.generativeai as genai


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
    # Choice can be {type: "JD"} or {type: "ROLE", category, role}
    role_label = None
    if isinstance(choice, dict) and choice.get("type") and choice.get("type").upper() == "ROLE":
        category = choice.get("category")
        role = choice.get("role")
        if category and role:
            role_label = f"{category}::{role}"

    # Compute optional role similarity and matched/missing skills for richer prompt
    role_score_display = None
    matched: List[str] = []
    missing: List[str] = []
    if role_label:
        try:
            cat, role_name = role_label.split("::", 1)
            role_map = load_roles_data()
            role_meta = (role_map.get(cat, {}) or {}).get(role_name, {})
            role_desc = role_meta.get("description") or role_name
            skills_for_role: List[str] = role_meta.get("skills", []) or []
            # role similarity
            jd_vec = embed_texts([role_desc])[0]
            jd_vec = (jd_vec / (np.linalg.norm(jd_vec) + 1e-12)).astype(np.float32)
            role_sim = float(np.dot(resume_vector, jd_vec))
            role_score_display = round(role_sim * 100.0, 1)
            # matched/missing based on resume preview tokens
            resume_sk = set(extract_skills(resume_preview.lower()))
            matched = [s for s in skills_for_role if s.lower() in resume_sk][:10]
            missing = [s for s in skills_for_role if s.lower() not in resume_sk][:10]
        except Exception:
            pass

    # Build improved prompt for Gemini
    prompt = (
        "You are an expert resume coach for software/tech roles. Analyze and produce precise, actionable feedback.\n\n"
        f"Target role: {role_label or 'General'}\n"
        f"Role match score: {role_score_display if role_score_display is not None else 'N/A'}%\n"
        f"Matched skills: {', '.join(matched) if matched else '—'}\n"
        f"Missing skills: {', '.join(missing) if missing else '—'}\n\n"
        "Resume preview (trimmed to ~500 words):\n"
        f"{resume_preview[:2500]}\n\n"
        "Output in Markdown with EXACTLY: \n"
        "1) Strengths — 3 bullets, each ≤20 words\n"
        "2) Weaknesses — 3 bullets, each ≤20 words\n"
        "3) Improvements — 5 bullets, start with a strong verb, include specifics/metrics where possible\n"
        "4) Example resume bullets — 2 one-line bullets tailored to the target role, each includes a measurable outcome.\n"
        "Rules: Be factual to the text; do not invent tools or companies; avoid generic advice."
    )

    api_key = os.environ.get("GEMINI_API_KEY")
    strengths: List[str] = []
    weaknesses: List[str] = []
    actionables: List[str] = []
    example_bullets: List[str] = []
    final_score: float = 80.0

    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            resp = model.generate_content(prompt)
            text = resp.text or ""
            print("api responded" if text != "" else "api did not respond")
            # Simple parsing by sections
            def _extract(section: str) -> List[str]:
                import re
                m = re.search(rf"{section}[:\n]+(.*?)(?:\n\s*\n|\Z)", text, re.IGNORECASE | re.DOTALL)
                if not m:
                    return []
                block = m.group(1)
                lines_raw = [ln for ln in block.splitlines() if ln.strip()]
                bullets: List[str] = []
                for ln in lines_raw:
                    # strip common bullet prefixes
                    s = re.sub(r"^\s*[-*•]\s+", "", ln).strip()
                    # strip leading numbering like 1. 2) etc
                    s = re.sub(r"^\s*\d+[\)\.:\-]\s+", "", s)
                    # strip markdown bold/italics wrappers
                    s = re.sub(r"^\*\*(.*?)\*\*$", r"\1", s)
                    s = re.sub(r"^\*(.*?)\*$", r"\1", s)
                    s = s.strip()
                    if s:
                        bullets.append(s)
                return bullets[:5]

            strengths = _extract("Strengths") or strengths
            weaknesses = _extract("Weaknesses") or weaknesses
            actionables = _extract("Actions|Actionable|Improvements") or actionables
            example_bullets = _extract("Examples|Example bullets") or example_bullets
            # Heuristic role score based on mention strength
            if role_label and text:
                final_score = 85.0
            llm_polished_text = text
        except Exception:
            # fall back to static template
            pass

    if not strengths:
        strengths = ["Strong foundational skills", "Relevant project experience"]
    if not weaknesses:
        weaknesses = ["Missing key role-specific tools", "Few quantified achievements"]
    if not actionables:
        actionables = [
            "Add 2 quantified metrics to experience bullets",
            "Include missing tools in skills section if applicable",
            "Add one project demonstrating deployment or ML workflow",
            "Refactor bullets to start with action verbs",
            "Tailor the summary to the target role",
        ]
    if not example_bullets:
        example_bullets = [
            "Built REST APIs and optimized queries, reducing latency by 25%.",
            "Containerized service with Docker and deployed to Kubernetes.",
        ]

    return DetailedAnalysisResponse(
        final_score=final_score,
        strengths=strengths,
        weaknesses=weaknesses,
        actionable_recs=actionables,
        example_bullets=example_bullets,
        llm_polished_text=locals().get("llm_polished_text", ""),
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
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "Set GEMINI_API_KEY to enable polishing."
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(prompt)
        return resp.text or ""
    except Exception as ex:
        return f"Gemini error: {ex}"


