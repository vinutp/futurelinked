"""Personal calendar / daily schedule for candidates and employers.

Plus a privacy-preserving lookup an employer uses when proposing an interview:
it returns only the DATES a candidate is busy — never the event titles — so the
employer gets a hint without seeing the candidate's private schedule.
"""

from datetime import datetime, timezone

import store
from framework import route, ApiError
from security import requires


@route("GET", "/api/schedule")
@requires(["employer", "candidate"])
def my_schedule(ctx):
    events = store.where("scheduleEvents", lambda e: e["userId"] == ctx.user["id"])
    events.sort(key=lambda e: (e["date"], e.get("createdAt", "")))
    return {"events": events}


@route("POST", "/api/schedule")
@requires(["employer", "candidate"])
def add_event(ctx):
    date = (ctx.body.get("date") or "").strip()
    title = (ctx.body.get("title") or "").strip()
    if not date or not title:
        raise ApiError(400, "A date and a title are required.")
    event = store.insert("scheduleEvents", {
        "userId": ctx.user["id"],
        "date": date,
        "title": title,
        "startTime": (ctx.body.get("startTime") or "").strip(),
        "endTime": (ctx.body.get("endTime") or "").strip(),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })
    return 201, {"event": event}


@route("DELETE", "/api/schedule/:id")
@requires(["employer", "candidate"])
def delete_event(ctx):
    event = store.find("scheduleEvents", lambda e: e["id"] == ctx.params["id"])
    if not event or event["userId"] != ctx.user["id"]:
        raise ApiError(404, "Event not found.")
    store.remove("scheduleEvents", lambda e: e["id"] == ctx.params["id"])
    return {"ok": True}


@route("GET", "/api/schedule/busy/:profileId")
@requires("employer")
def candidate_busy(ctx):
    """Busy DATES only (no titles) for a candidate — used by interview scheduling."""
    profile = store.find("candidateProfiles", lambda p: p["id"] == ctx.params["profileId"])
    if not profile:
        raise ApiError(404, "Candidate not found.")
    dates = sorted({e["date"] for e in store.where("scheduleEvents", lambda e: e["userId"] == profile["userId"])})
    return {"busyDates": dates}
