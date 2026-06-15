"""Job endpoints: listing/search, recommendations, posting, talent shortlist.

Note on route order: specific paths (`/recommended`, `/mine/posted`) are
registered before the `:id` route so they aren't swallowed by the param match.
"""

from datetime import datetime, timezone

import store
from framework import route, ApiError
from security import requires
from matching import rank_jobs_for_candidate, rank_candidates_for_job


def _with_applicant_count(job):
    count = len(store.where("applications", lambda a: a["jobId"] == job["id"]))
    return {**job, "applicants": count}


def _public_candidate(profile):
    return {
        "id": profile["id"], "userId": profile["userId"], "name": profile["name"],
        "headline": profile.get("headline"), "location": profile.get("location"),
        "seniority": profile.get("seniority"), "skills": profile.get("skills"),
        "summary": profile.get("summary"),
    }


@route("GET", "/api/jobs")
def list_jobs(ctx):
    q = ctx.query
    jobs = store.all_rows("jobs")

    if q.get("q"):
        needle = q["q"].lower()
        jobs = [j for j in jobs if needle in " ".join([
            j.get("title", ""), j.get("company", ""), j.get("description", ""),
            " ".join(j.get("requiredSkills", [])),
        ]).lower()]
    if q.get("location"):
        loc = q["location"].lower()
        jobs = [j for j in jobs if loc in (j.get("location") or "").lower()]
    if q.get("type"):
        jobs = [j for j in jobs if (j.get("type") or "").lower() == q["type"].lower()]
    if q.get("remote") == "true":
        jobs = [j for j in jobs if j.get("remote")]
    if q.get("internship") == "true":
        jobs = [j for j in jobs if j.get("isInternship")]
    if q.get("skill"):
        s = q["skill"].lower()
        jobs = [j for j in jobs if any(s in rs.lower() for rs in j.get("requiredSkills", []))]

    jobs.sort(key=lambda j: j.get("postedAt", ""), reverse=True)
    return {"jobs": [_with_applicant_count(j) for j in jobs]}


@route("GET", "/api/jobs/recommended")
@requires("candidate")
def recommended(ctx):
    profile = store.find("candidateProfiles", lambda p: p["userId"] == ctx.user["id"])
    if not profile:
        raise ApiError(404, "Complete your profile first.")
    ranked = [m for m in rank_jobs_for_candidate(profile, store.all_rows("jobs")) if m["score"] > 0]
    return {"matches": ranked[:12]}


@route("GET", "/api/jobs/mine/posted")
@requires("employer")
def my_jobs(ctx):
    jobs = [_with_applicant_count(j) for j in store.where("jobs", lambda j: j["employerId"] == ctx.user["id"])]
    jobs.sort(key=lambda j: j.get("postedAt", ""), reverse=True)
    return {"jobs": jobs}


@route("POST", "/api/jobs")
@requires("employer")
def create_job(ctx):
    employer = store.find("employerProfiles", lambda p: p["userId"] == ctx.user["id"])
    body = ctx.body
    if not body.get("title") or not body.get("description"):
        raise ApiError(400, "Title and description are required.")
    job = store.insert("jobs", {
        "employerId": ctx.user["id"],
        "title": str(body["title"]).strip(),
        "company": employer["companyName"] if employer else "Company",
        "location": body.get("location", ""),
        "type": body.get("type", "Full-time"),
        "seniority": body.get("seniority", "mid"),
        "remote": bool(body.get("remote")),
        "isInternship": bool(body.get("isInternship")),
        "salaryMin": body.get("salaryMin"),
        "salaryMax": body.get("salaryMax"),
        "description": str(body["description"]).strip(),
        "requiredSkills": body.get("requiredSkills") if isinstance(body.get("requiredSkills"), list) else [],
        "postedAt": datetime.now(timezone.utc).isoformat(),
    })
    return 201, {"job": job}


@route("GET", "/api/jobs/:id/candidates")
@requires("employer")
def job_candidates(ctx):
    job = store.find("jobs", lambda j: j["id"] == ctx.params["id"])
    if not job or job["employerId"] != ctx.user["id"]:
        raise ApiError(404, "Job not found.")
    findable = store.where("candidateProfiles", lambda p: p.get("visibility") != "private")
    ranked = [m for m in rank_candidates_for_job(job, findable) if m["score"] > 25][:20]
    return {"matches": [{**m, "profile": _public_candidate(m["profile"])} for m in ranked]}


@route("GET", "/api/jobs/:id")
def get_job(ctx):
    job = store.find("jobs", lambda j: j["id"] == ctx.params["id"])
    if not job:
        raise ApiError(404, "Job not found.")
    return {"job": _with_applicant_count(job)}


@route("DELETE", "/api/jobs/:id")
@requires("employer")
def delete_job(ctx):
    job = store.find("jobs", lambda j: j["id"] == ctx.params["id"])
    if not job or job["employerId"] != ctx.user["id"]:
        raise ApiError(404, "Job not found.")
    store.remove("jobs", lambda j: j["id"] == ctx.params["id"])
    store.remove("applications", lambda a: a["jobId"] == ctx.params["id"])
    return {"ok": True}
