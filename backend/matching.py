"""Explainable matching engine.

Career OS promises "no black-box scores, no false precision". So matching here
is intentionally transparent: every score is the sum of named, inspectable
contributions, and every match ships with plain-English reasons and an honest
note about where the uncertainty sits.

The score is a 0-100 blend of four signals:
    skills overlap        (up to 55)
    location alignment    (up to 15)
    seniority fit         (up to 15)
    work-type preference  (up to 15)
"""

SENIORITY_ORDER = ["intern", "junior", "mid", "senior", "lead", "principal"]


def _norm(value):
    return str(value or "").strip().lower()


def _skill_set(skills):
    return {_norm(s) for s in (skills or []) if _norm(s)}


def _seniority_rank(level):
    norm = _norm(level)
    return SENIORITY_ORDER.index(norm) if norm in SENIORITY_ORDER else 1


def score_match(profile, job):
    """Score one candidate profile against one job.

    Returns a dict: score, reasons, gaps, confidence, breakdown,
    matchedSkills, missingSkills.
    """
    reasons = []
    gaps = []

    candidate_skills = _skill_set(profile.get("skills"))
    job_skills = _skill_set(job.get("requiredSkills"))

    # --- Skills overlap (up to 55) -----------------------------------------
    matched = [s for s in job_skills if s in candidate_skills]
    missing = [s for s in job_skills if s not in candidate_skills]
    coverage = (len(matched) / len(job_skills)) if job_skills else 0
    skills_points = round(coverage * 55)

    if matched:
        reasons.append(
            f"Shares {len(matched)} of {len(job_skills)} required skills: "
            f"{', '.join(matched[:5])}."
        )
    if missing:
        plural = "s" if len(missing) > 1 else ""
        gaps.append(f"Missing {len(missing)} skill{plural}: {', '.join(missing[:5])}.")

    # --- Location alignment (up to 15) -------------------------------------
    location_points = 0
    cand_loc = _norm(profile.get("location"))
    job_loc = _norm(job.get("location"))
    if job.get("remote"):
        location_points = 15
        reasons.append("Role is remote-friendly, so location is not a constraint.")
    elif cand_loc and job_loc and cand_loc in job_loc:
        location_points = 15
        reasons.append(f"Based in {profile.get('location')}, matching the role location.")
    elif cand_loc and job_loc:
        location_points = 4
        gaps.append(f"Role is in {job.get('location')}; candidate is in {profile.get('location')}.")

    # --- Seniority fit (up to 15) ------------------------------------------
    distance = abs(_seniority_rank(profile.get("seniority")) - _seniority_rank(job.get("seniority")))
    seniority_points = max(0, 15 - distance * 6)
    if distance == 0:
        reasons.append(f"Seniority lines up at the {job.get('seniority')} level.")
    elif distance == 1:
        reasons.append("Seniority is one step off — a realistic stretch or step.")
    else:
        gaps.append(
            f"Seniority gap: role expects {job.get('seniority')}, "
            f"candidate reads as {profile.get('seniority') or 'unspecified'}."
        )

    # --- Work-type preference (up to 15) -----------------------------------
    desired = profile.get("desiredType")
    if not desired or _norm(desired) == _norm(job.get("type")):
        type_points = 15
        if desired:
            reasons.append(f"Matches the preferred work type ({job.get('type')}).")
    else:
        type_points = 5

    score = min(100, skills_points + location_points + seniority_points + type_points)

    # Confidence is about how much evidence we had, not how high the score is.
    if not job_skills or not candidate_skills:
        confidence = "low"
    elif len(job_skills) >= 4 and len(candidate_skills) >= 5:
        confidence = "high"
    else:
        confidence = "moderate"

    return {
        "score": score,
        "reasons": reasons,
        "gaps": gaps,
        "confidence": confidence,
        "breakdown": {
            "skillsPoints": skills_points,
            "locationPoints": location_points,
            "seniorityPoints": seniority_points,
            "typePoints": type_points,
        },
        "matchedSkills": matched,
        "missingSkills": missing,
    }


def rank_jobs_for_candidate(profile, jobs):
    """Rank a list of jobs for one candidate profile, best first."""
    ranked = [{"job": job, **score_match(profile, job)} for job in jobs]
    ranked.sort(key=lambda m: m["score"], reverse=True)
    return ranked


def rank_candidates_for_job(job, profiles):
    """Rank a list of candidate profiles for one job, best first."""
    ranked = [{"profile": p, **score_match(p, job)} for p in profiles]
    ranked.sort(key=lambda m: m["score"], reverse=True)
    return ranked
