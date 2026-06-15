"""Adaptive Readiness Profile (University module 03).

"What if 'ready for the world' was a live signal, not a graduation date?"

Readiness is derived continuously from the evidence already in a candidate's
profile — skills, hands-on experience, education — rather than asserted by a
diploma. It is reported as four named dimensions plus an overall band, and it
always lists what would move the needle. No black box: the inputs are right
there in the breakdown.
"""

import re
from datetime import datetime, timezone

DIMENSIONS = [
    {"key": "skillDepth", "label": "Skill depth"},
    {"key": "appliedExperience", "label": "Applied experience"},
    {"key": "credentials", "label": "Credentials"},
    {"key": "profileSignal", "label": "Profile completeness"},
]


def _clamp(n):
    return max(0, min(100, round(n)))


def compute_readiness(profile):
    skills = profile.get("skills") or []
    experience = profile.get("experience") or []
    education = profile.get("education") or []

    # Skill depth: breadth of skills, with diminishing returns past ~12.
    skill_depth = _clamp(min(len(skills), 12) * 8.5)

    # Applied experience: roles/internships/projects carry the most weight.
    internships = sum(
        1
        for e in experience
        if re.search(r"intern|project|placement|co-op", f"{e.get('title','')} {e.get('type','')}", re.I)
    )
    applied_experience = _clamp(len(experience) * 22 + internships * 10)

    # Credentials: completed education entries.
    credentials = _clamp(len(education) * 45)

    # Profile completeness: do they present well to an employer?
    signal = 0
    if profile.get("headline"):
        signal += 25
    if profile.get("summary") and len(profile["summary"]) > 40:
        signal += 25
    if profile.get("location"):
        signal += 15
    if len(skills) >= 3:
        signal += 20
    if len(experience) >= 1:
        signal += 15
    profile_signal = _clamp(signal)

    overall = _clamp(
        skill_depth * 0.35
        + applied_experience * 0.35
        + credentials * 0.15
        + profile_signal * 0.15
    )

    breakdown = {
        "skillDepth": skill_depth,
        "appliedExperience": applied_experience,
        "credentials": credentials,
        "profileSignal": profile_signal,
    }

    return {
        "overall": overall,
        "band": _band(overall),
        "breakdown": breakdown,
        "dimensions": [{**d, "value": breakdown[d["key"]]} for d in DIMENSIONS],
        "nextSteps": _next_steps(breakdown, profile),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def _band(score):
    if score >= 75:
        return "Job-ready"
    if score >= 55:
        return "Nearly ready"
    if score >= 35:
        return "Developing"
    return "Early stage"


def _next_steps(breakdown, profile):
    """The honest, actionable part: what would move readiness up next."""
    steps = []
    if breakdown["appliedExperience"] < 60:
        steps.append("Add an internship, placement, or project to show applied work.")
    if breakdown["skillDepth"] < 60:
        steps.append("List a few more verified skills relevant to your target roles.")
    if breakdown["profileSignal"] < 80:
        if not profile.get("summary") or len(profile.get("summary", "")) <= 40:
            steps.append("Write a 2-3 sentence summary so employers grasp your focus quickly.")
        if not profile.get("headline"):
            steps.append("Add a headline that names your field and level.")
    if breakdown["credentials"] < 45:
        steps.append("Add your degree or certification details.")
    return steps or ["Your profile is well-rounded — keep it current as you take on new work."]
