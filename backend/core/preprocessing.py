from typing import List, Set
import re
import os

from .parser import normalize_whitespace


def clean_text(text: str) -> str:
    text = normalize_whitespace(text)
    # Remove repeated page headers/footers heuristically
    text = re.sub(r"\n?Page \d+ of \d+\n?", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"\n?\d+\s*/\s*\d+\n?", "\n", text)
    return text


def extract_skills(lower_text: str) -> List[str]:
    text = lower_text.lower()
    skills_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "skills.txt")
    skills: List[str] = []
    if os.path.exists(skills_path):
        with open(skills_path, "r", encoding="utf-8") as f:
            for line in f:
                s = line.strip()
                if not s:
                    continue
                if re.search(rf"\b{re.escape(s)}\b", text):
                    skills.append(s)
    # Deduplicate preserve order
    seen: Set[str] = set()
    uniq: List[str] = []
    for s in skills:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq


