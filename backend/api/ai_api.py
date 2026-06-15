"""AI endpoints: capability status, career paths, resume polish."""

import store
from framework import route, ApiError
from security import requires
import ai


@route("GET", "/api/ai/status")
def status(ctx):
    return {"aiEnabled": ai.ai_enabled, "model": ai.MODEL}


@route("GET", "/api/ai/career-paths")
@requires("candidate")
def career_paths(ctx):
    profile = store.find("candidateProfiles", lambda p: p["userId"] == ctx.user["id"])
    if not profile:
        raise ApiError(404, "Profile not found.")
    return ai.career_trajectories(profile)


@route("POST", "/api/ai/polish-resume")
@requires("candidate")
def polish_resume(ctx):
    text = (ctx.body.get("text") or "").strip()
    if not text:
        raise ApiError(400, "Provide some text to polish.")
    return ai.polish_resume(text, ctx.body.get("role"))
