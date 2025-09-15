from typing import List
import io
import re


def parse_resume_bytes(content: bytes, filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        try:
            import pdfplumber  # type: ignore
            text_pages: List[str] = []
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    text_pages.append(page.extract_text() or "")
            return "\n".join(text_pages)
        except Exception:
            pass
    if lower.endswith(".docx"):
        try:
            import docx  # python-docx
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            pass
    # Fallback: try decode as UTF-8
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception:
        return ""


_whitespace_re = re.compile(r"\s+")


def normalize_whitespace(text: str) -> str:
    return _whitespace_re.sub(" ", text).strip()


