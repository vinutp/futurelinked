"""Application endpoints: apply, track, employer pipeline, the offer/reject/
interview actions, and the candidate's interview response.

Status model (per spec) is just three employer actions:
    offer · rejected · interview
Each action notifies the candidate; applying notifies the employer; the
candidate's interview accept/decline notifies the employer back.
"""

from datetime import datetime, timezone

import store
import notify
from framework import route, ApiError
from security import requires
from matching import score_match

ACTION_STATUSES = ("offer", "rejected", "interview")

# Fields the candidate fills in on the per-job application form.
CV_FIELDS = ["name", "email", "phone", "linkedin", "location", "headline",
             "summary", "skills", "education", "projects", "experience"]


def _resume_snapshot(profile):
    """Freeze the candidate's CV at the moment they apply, so the employer sees
    exactly what was submitted even if the candidate edits their profile later."""
    if not profile:
        return {}
    return {k: profile.get(k) for k in CV_FIELDS}


def _candidate_name(app):
    snap = app.get("resumeSnapshot") or {}
    if snap.get("name"):
        return snap["name"]
    profile = store.find("candidateProfiles", lambda p: p["id"] == app.get("candidateProfileId"))
    return profile["name"] if profile else "A candidate"


@route("POST", "/api/applications")
@requires("candidate")
def apply(ctx):
    body = ctx.body
    job_id = body.get("jobId")
    job = store.find("jobs", lambda j: j["id"] == job_id)
    if not job:
        raise ApiError(404, "Job not found.")
    if not body.get("declaration"):
        raise ApiError(400, "You must certify the information is accurate before applying.")

    profile = store.find("candidateProfiles", lambda p: p["userId"] == ctx.user["id"])
    if store.find("applications", lambda a: a["jobId"] == job_id and a["candidateId"] == ctx.user["id"]):
        raise ApiError(409, "You have already applied to this job.")

    match = score_match(profile, job) if profile else {"score": None}
    application = store.insert("applications", {
        "jobId": job_id,
        "candidateId": ctx.user["id"],
        "candidateProfileId": profile["id"] if profile else None,
        "coverNote": body.get("coverNote", ""),
        # Application form fields:
        "expectedSalary": body.get("expectedSalary"),
        "workArrangement": body.get("workArrangement", ""),
        "preferredLocation": body.get("preferredLocation", ""),
        "earliestStartDate": body.get("earliestStartDate", ""),
        "declaration": True,
        # Attached CV (a point-in-time copy):
        "resumeSnapshot": _resume_snapshot(profile),
        # Interview scheduling (filled later by the employer / candidate):
        "interviewDate": "",
        "interviewStartTime": "",
        "interviewEndTime": "",
        "interviewResponse": "",      # '' | 'accepted' | 'rejected'
        "interviewRejectReason": "",
        "status": "applied",
        "matchScore": match["score"],
        "appliedAt": datetime.now(timezone.utc).isoformat(),
    })

    # Notify the employer that a new application arrived.
    name = profile["name"] if profile else "A candidate"
    notify.push(job["employerId"], "application",
                f"{name} applied for {job['title']}.", f"#/applicants/{job_id}")
    return 201, {"application": application}


@route("GET", "/api/applications/mine")
@requires("candidate")
def mine(ctx):
    apps = store.where("applications", lambda a: a["candidateId"] == ctx.user["id"])
    enriched = [{**a, "job": store.find("jobs", lambda j: j["id"] == a["jobId"])} for a in apps]
    enriched.sort(key=lambda a: a.get("appliedAt", ""), reverse=True)
    return {"applications": enriched}


@route("GET", "/api/applications/job/:jobId")
@requires("employer")
def for_job(ctx):
    job = store.find("jobs", lambda j: j["id"] == ctx.params["jobId"])
    if not job or job["employerId"] != ctx.user["id"]:
        raise ApiError(404, "Job not found.")

    result = []
    for a in store.where("applications", lambda a: a["jobId"] == ctx.params["jobId"]):
        profile = store.find("candidateProfiles", lambda p: p["id"] == a["candidateProfileId"])
        result.append({
            **a,
            "candidate": {
                "id": profile["id"], "userId": profile["userId"], "name": profile["name"],
                "headline": profile.get("headline"), "location": profile.get("location"),
                "skills": profile.get("skills"), "seniority": profile.get("seniority"),
            } if profile else None,
            "match": score_match(profile, job) if profile else None,
        })
    result.sort(key=lambda a: a.get("matchScore") or 0, reverse=True)
    return {"applications": result, "jobTitle": job["title"]}


@route("PATCH", "/api/applications/:id/status")
@requires("employer")
def set_status(ctx):
    """Employer actions: offer, rejected, or interview (with a proposed date)."""
    status = ctx.body.get("status")
    if status not in ACTION_STATUSES:
        raise ApiError(400, f"Status must be one of: {', '.join(ACTION_STATUSES)}")
    app = store.find("applications", lambda a: a["id"] == ctx.params["id"])
    if not app:
        raise ApiError(404, "Application not found.")
    job = store.find("jobs", lambda j: j["id"] == app["jobId"])
    if not job or job["employerId"] != ctx.user["id"]:
        raise ApiError(403, "Not your job posting.")

    patch = {"status": status}
    if status == "interview":
        date = (ctx.body.get("interviewDate") or "").strip()
        if not date:
            raise ApiError(400, "An interview date is required.")
        start = (ctx.body.get("interviewStartTime") or "").strip()
        end = (ctx.body.get("interviewEndTime") or "").strip()
        if not start or not end:
            raise ApiError(400, "An interview start and end time are required.")
        patch.update({
            "interviewDate": date, "interviewStartTime": start, "interviewEndTime": end,
            "interviewResponse": "", "interviewRejectReason": "",
        })

    updated = store.update("applications", lambda a: a["id"] == ctx.params["id"], patch)

    # Notify the candidate.
    if status == "offer":
        msg = f"Good news — you received an offer for {job['title']}."
    elif status == "rejected":
        msg = f"Update on your application for {job['title']}: not successful this time."
    else:
        msg = (f"You're invited to interview for {job['title']} on "
               f"{patch['interviewDate']} at {patch['interviewStartTime']}–{patch['interviewEndTime']}.")
    notify.push(app["candidateId"], "status", msg, "#/applications")
    return {"application": updated}


@route("POST", "/api/applications/:id/interview-response")
@requires("candidate")
def interview_response(ctx):
    """Candidate accepts or declines a proposed interview (decline needs a reason)."""
    response = ctx.body.get("response")
    if response not in ("accepted", "rejected"):
        raise ApiError(400, "Response must be 'accepted' or 'rejected'.")
    reason = (ctx.body.get("reason") or "").strip()
    if response == "rejected" and not reason:
        raise ApiError(400, "Please give a reason for declining.")

    app = store.find("applications", lambda a: a["id"] == ctx.params["id"])
    if not app or app["candidateId"] != ctx.user["id"]:
        raise ApiError(404, "Application not found.")
    if app.get("status") != "interview" or not app.get("interviewDate"):
        raise ApiError(400, "There is no interview to respond to.")

    updated = store.update(
        "applications", lambda a: a["id"] == ctx.params["id"],
        {"interviewResponse": response, "interviewRejectReason": reason if response == "rejected" else ""},
    )

    job = store.find("jobs", lambda j: j["id"] == app["jobId"])
    name = _candidate_name(app)
    verb = "accepted" if response == "accepted" else "declined"
    text = f"{name} {verb} the interview for {job['title']}."
    if response == "rejected":
        text += f" Reason: {reason}"
    notify.push(job["employerId"], "interview-response", text, f"#/applicants/{job['id']}")
    return {"application": updated}
