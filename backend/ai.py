"""AI layer for Career OS.

Two capabilities:
  1. career_trajectories(profile) — given a candidate's "shape" (skills,
     seniority, field), surface a *range* of realistic next moves with
     trade-offs and an honest uncertainty note. Navigation, not prediction.
  2. polish_resume(text, role) — rewrite rough notes into crisp resume bullets.

Both prefer Anthropic's Claude when ANTHROPIC_API_KEY is set, and fall back to
a deterministic, explainable heuristic so the prototype is fully functional
with zero configuration. The Claude call uses urllib (standard library) — no
third-party SDK. The fallback is honest about being a heuristic.
"""

import json
import os
import re
import urllib.request

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
# Default to Anthropic's most capable generally-available model.
MODEL = os.environ.get("CAREER_OS_MODEL", "claude-fable-5")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

ai_enabled = bool(API_KEY)


def _call_claude(system, user_prompt, max_tokens=1024):
    body = json.dumps(
        {
            "model": MODEL,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user_prompt}],
        }
    ).encode()
    req = urllib.request.Request(
        ANTHROPIC_URL,
        data=body,
        headers={
            "content-type": "application/json",
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return "".join(part.get("text", "") for part in data.get("content", [])).strip()


def _extract_json(text):
    start = re.search(r"[\[{]", text)
    if not start:
        return text
    end = max(text.rfind("}"), text.rfind("]"))
    return text[start.start():end + 1] if end != -1 else text


# --- Capability 1: career trajectories ------------------------------------
_CAREER_SYSTEM = (
    "You are Career OS, a career *navigation* tool — not a prediction engine. "
    "Given a person's current shape, surface a RANGE of realistic next moves "
    "for people like them. For each path explain the trade-off plainly and name "
    "where the uncertainty sits. Never invent precise salary numbers or "
    "probabilities. Speak like a thoughtful human mentor. Return ONLY valid JSON "
    'of the form: {"paths":[{"title":"...","horizon":"...","rationale":"...",'
    '"tradeoff":"...","buildNext":["skill"]}],"uncertainty":"..."}'
)


def career_trajectories(profile):
    if API_KEY:
        try:
            prompt = (
                "Candidate shape:\n"
                f"- Field/headline: {profile.get('headline') or 'unspecified'}\n"
                f"- Seniority: {profile.get('seniority') or 'unspecified'}\n"
                f"- Skills: {', '.join(profile.get('skills') or []) or 'none listed'}\n"
                f"- Location: {profile.get('location') or 'unspecified'}\n"
                f"- Summary: {profile.get('summary') or 'none'}\n\n"
                "Give 3 realistic paths with trade-offs and an uncertainty note."
            )
            parsed = json.loads(_extract_json(_call_claude(_CAREER_SYSTEM, prompt, 1200)))
            return {"source": "claude", "model": MODEL, **parsed}
        except Exception as err:  # noqa: BLE001 - any failure falls back gracefully
            print("Claude trajectory call failed, using heuristic:", err)
    return {"source": "heuristic", **_heuristic_trajectories(profile)}


def _heuristic_trajectories(profile):
    seniority = (profile.get("seniority") or "junior").lower()
    field = profile.get("headline") or "your field"
    skills = profile.get("skills") or []

    steps = {
        "intern": ["junior", "specialist"],
        "junior": ["mid-level", "specialist"],
        "mid": ["senior", "specialist lead"],
        "senior": ["lead / staff", "management"],
        "lead": ["principal", "engineering manager"],
    }
    nxt = steps.get(seniority, ["the next level up", "a specialist track"])

    paths = [
        {
            "title": f"Deepen as a specialist in {field}",
            "horizon": "1-3 years",
            "rationale": (
                f"You already have momentum in {field}"
                + (f" with strengths in {', '.join(skills[:3])}" if skills else "")
                + ". Going deeper compounds that."
            ),
            "tradeoff": "Higher leverage and pay over time, but a narrower set of employers who value the depth.",
            "buildNext": _suggest_skills(skills, "depth"),
        },
        {
            "title": f"Step up to {nxt[0]}",
            "horizon": "12-24 months",
            "rationale": "A natural progression that broadens scope and responsibility while staying in a familiar domain.",
            "tradeoff": "More ownership and visibility, but more time on coordination and less on hands-on craft.",
            "buildNext": _suggest_skills(skills, "breadth"),
        },
        {
            "title": "Pivot toward an adjacent field",
            "horizon": "2-4 years",
            "rationale": "Your transferable skills open adjacent roles where the same strengths apply to a new problem space.",
            "tradeoff": "A reset on domain credibility in exchange for a wider long-term landscape and renewed motivation.",
            "buildNext": ["portfolio project in the new domain", "one credential or course"],
        },
    ]
    return {
        "paths": paths,
        "uncertainty": (
            "These are directions, not destinations. The biggest unknowns are local "
            "hiring demand and how your interests shift once you are closer to each "
            "path. Treat this as a map, not a forecast."
        ),
    }


def _suggest_skills(skills, mode):
    lower = [s.lower() for s in skills]
    pool = (
        ["system design", "mentoring", "domain architecture", "advanced tooling"]
        if mode == "depth"
        else ["stakeholder communication", "project planning", "cross-team delivery", "product sense"]
    )
    return [s for s in pool if s not in lower][:3]


# --- Capability 2: resume polish (into a summary paragraph) ----------------
_RESUME_SYSTEM = (
    "You rewrite a person's rough career notes into ONE polished, professional "
    "summary paragraph (about 2-4 sentences) suitable for the top of a resume. "
    "Confident but not boastful, specific, and natural. Do not invent fake "
    "metrics. Return ONLY the paragraph as plain text — no quotes, labels, "
    "headings, or bullet points."
)


def polish_resume(text, role=None):
    if API_KEY:
        try:
            out = _call_claude(_RESUME_SYSTEM, f"Role: {role or 'unspecified'}\nNotes: {text}", 400)
            paragraph = out.strip().strip('"')
            if paragraph:
                return {"source": "claude", "paragraph": paragraph}
        except Exception as err:  # noqa: BLE001
            print("Claude resume call failed, using heuristic:", err)
    return {"source": "heuristic", "paragraph": _heuristic_paragraph(text)}


def _heuristic_paragraph(text):
    verbs = ["Delivered", "Built", "Led", "Improved", "Owned"]
    parts = [p.strip() for p in re.split(r"[\n.;]+", str(text or "")) if p.strip()]
    sentences = []
    for i, part in enumerate(parts):
        cleaned = re.sub(r"^(i |we )", "", part, flags=re.I).strip()
        if not cleaned:
            continue
        capped = cleaned[:1].upper() + cleaned[1:]
        if re.match(r"^(delivered|built|led|improved|owned|created|designed)", capped, re.I):
            sentences.append(capped)
        else:
            sentences.append(f"{verbs[i % len(verbs)]} {capped[:1].lower()}{capped[1:]}")
    paragraph = ". ".join(sentences)
    if paragraph and not paragraph.endswith("."):
        paragraph += "."
    return paragraph
