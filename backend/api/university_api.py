"""University Career OS — the three institutional modules, wired to live data.

    Module 01 · Lifelong Outcome Loop       -> GET /outcomes
    Module 03 · Adaptive Readiness Profile  -> GET /students
    Module 04 · Live Internship Marketplace -> GET /internships, /placements
    (bonus)   · Future-State Curriculum      -> GET /skills-gap

Everything is scoped to the logged-in university account. A university "owns"
the candidate profiles whose universityId points at it, plus the outcome and
placement records it has recorded over time.
"""

import store
from framework import route, ApiError
from security import requires
from readiness import compute_readiness
from matching import rank_candidates_for_job


def _uni_profile(user_id):
    return store.find("universityProfiles", lambda p: p["userId"] == user_id)


def _cohort(university_id):
    return store.where("candidateProfiles", lambda p: p.get("universityId") == university_id)


def _median(values):
    nums = sorted(v for v in values if v is not None)
    return nums[len(nums) // 2] if nums else None


# --- Module 01 · Lifelong Outcome Loop ------------------------------------
@route("GET", "/api/university/outcomes")
@requires("university")
def outcomes(ctx):
    uni = _uni_profile(ctx.user["id"])
    records = store.where("outcomes", lambda o: o["universityId"] == uni["id"])
    employed = [o for o in records if o["status"] == "employed"]

    employer_counts = {}
    for o in employed:
        if o.get("employer"):
            employer_counts[o["employer"]] = employer_counts.get(o["employer"], 0) + 1
    top_employers = sorted(
        ({"name": k, "count": v} for k, v in employer_counts.items()),
        key=lambda e: e["count"], reverse=True,
    )[:6]

    # Outcomes by graduation cohort — the loop that keeps going.
    by_cohort = {}
    for o in records:
        c = by_cohort.setdefault(o["gradYear"], {"gradYear": o["gradYear"], "total": 0, "employed": 0, "salaries": []})
        c["total"] += 1
        if o["status"] == "employed":
            c["employed"] += 1
            if o.get("salary"):
                c["salaries"].append(o["salary"])
    cohorts = sorted((
        {
            "gradYear": c["gradYear"], "total": c["total"],
            "employmentRate": round(c["employed"] / c["total"] * 100) if c["total"] else 0,
            "medianSalary": _median(c["salaries"]),
        } for c in by_cohort.values()
    ), key=lambda c: c["gradYear"])

    # Which programs paid off.
    by_program = {}
    for o in records:
        key = o.get("program") or "Unspecified"
        p = by_program.setdefault(key, {"program": key, "total": 0, "employed": 0, "salaries": []})
        p["total"] += 1
        if o["status"] == "employed":
            p["employed"] += 1
            if o.get("salary"):
                p["salaries"].append(o["salary"])
    programs = [
        {
            "program": p["program"], "total": p["total"],
            "employmentRate": round(p["employed"] / p["total"] * 100) if p["total"] else 0,
            "medianSalary": _median(p["salaries"]),
        } for p in by_program.values()
    ]

    return {
        "summary": {
            "tracked": len(records),
            "employmentRate": round(len(employed) / len(records) * 100) if records else 0,
            "medianSalary": _median([o.get("salary") for o in employed]),
            "stillTrackedAfter5y": len([o for o in records if o.get("yearsTracked", 0) >= 5]),
        },
        "cohorts": cohorts,
        "topEmployers": top_employers,
        "programs": programs,
        "recent": sorted(records, key=lambda o: o["gradYear"], reverse=True)[:15],
    }


# --- Module 03 · Adaptive Readiness Profile -------------------------------
@route("GET", "/api/university/students")
@requires("university")
def students(ctx):
    uni = _uni_profile(ctx.user["id"])
    result = []
    for p in _cohort(uni["id"]):
        readiness = compute_readiness(p)
        result.append({
            "id": p["id"], "name": p["name"], "headline": p.get("headline"),
            "seniority": p.get("seniority"), "skills": p.get("skills"),
            "readiness": readiness,
            "needsAttention": readiness["overall"] < 45,  # "intervene early"
        })

    bands = {"Job-ready": 0, "Nearly ready": 0, "Developing": 0, "Early stage": 0}
    for s in result:
        bands[s["readiness"]["band"]] += 1

    result.sort(key=lambda s: s["readiness"]["overall"])
    avg = round(sum(s["readiness"]["overall"] for s in result) / len(result)) if result else 0
    return {
        "students": result,
        "distribution": bands,
        "averageReadiness": avg,
        "needsAttention": len([s for s in result if s["needsAttention"]]),
    }


# --- Module 04 · Live Internship Marketplace ------------------------------
@route("GET", "/api/university/internships")
@requires("university")
def internships(ctx):
    uni = _uni_profile(ctx.user["id"])
    cohort = _cohort(uni["id"])
    enriched = []
    for job in store.where("jobs", lambda j: j.get("isInternship")):
        ranked = [m for m in rank_candidates_for_job(job, cohort) if m["score"] > 20][:3]
        enriched.append({
            "job": job,
            "topMatches": [
                {
                    "score": m["score"], "reasons": m["reasons"],
                    "student": {"id": m["profile"]["id"], "name": m["profile"]["name"], "headline": m["profile"].get("headline")},
                } for m in ranked
            ],
        })
    return {"internships": enriched}


@route("GET", "/api/university/placements")
@requires("university")
def placements(ctx):
    uni = _uni_profile(ctx.user["id"])
    records = store.where("placements", lambda p: p["universityId"] == uni["id"])
    meaningful = len([p for p in records if p.get("ledSomewhere")])
    records.sort(key=lambda p: p.get("startedAt", ""), reverse=True)
    return {
        "placements": records,
        "summary": {
            "total": len(records),
            "meaningfulRate": round(meaningful / len(records) * 100) if records else 0,
            "converted": len([p for p in records if p.get("convertedToOffer")]),
        },
    }


# --- Bonus · Future-State Curriculum signal -------------------------------
@route("GET", "/api/university/skills-gap")
@requires("university")
def skills_gap(ctx):
    uni = _uni_profile(ctx.user["id"])
    cohort = _cohort(uni["id"])
    jobs = store.all_rows("jobs")

    demand = _count_skills(skill for j in jobs for skill in j.get("requiredSkills", []))
    supply = _count_skills(skill for s in cohort for skill in s.get("skills", []))

    gaps = []
    for skill, demand_count in demand.items():
        supply_count = supply.get(skill, 0)
        coverage = round(supply_count / len(cohort) * 100) if cohort else 0
        gaps.append({"skill": skill, "demandCount": demand_count, "studentsWithSkill": supply_count, "coverage": coverage})
    gaps.sort(key=lambda g: (-g["demandCount"], g["coverage"]))

    return {
        "gaps": gaps[:12],
        "cohortSize": len(cohort),
        "note": (
            "Demand is read from live job postings on the platform; supply is the "
            "share of your cohort listing each skill. Low-coverage, high-demand "
            "skills are curriculum candidates."
        ),
    }


def _count_skills(skills):
    counts = {}
    for raw in skills:
        skill = str(raw or "").strip()
        if skill:
            counts[skill] = counts.get(skill, 0) + 1
    return counts
