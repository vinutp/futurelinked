"""Profile endpoints. Shape depends on the account role."""

import store
from framework import route, ApiError
from security import requires
from readiness import compute_readiness

COLLECTION_FOR = {
    "candidate": "candidateProfiles",
    "employer": "employerProfiles",
    "university": "universityProfiles",
}

# Whitelist the fields each role may set, so clients can't write arbitrary keys.
EDITABLE = {
    "candidate": ["name", "headline", "email", "phone", "linkedin", "location",
                  "seniority", "desiredType", "summary", "skills", "education",
                  "projects", "experience", "visibility", "universityId"],
    "employer": ["companyName", "industry", "location", "about", "website"],
    "university": ["name", "country", "programs"],
}


def _decorate(profile, role):
    """Attach the live readiness score to candidate profiles."""
    if role != "candidate":
        return profile
    return {**profile, "readiness": compute_readiness(profile)}


@route("GET", "/api/profile/me")
@requires()
def get_me(ctx):
    collection = COLLECTION_FOR[ctx.user["role"]]
    profile = store.find(collection, lambda p: p["userId"] == ctx.user["id"])
    if not profile:
        raise ApiError(404, "Profile not found.")
    return {"profile": _decorate(profile, ctx.user["role"])}


@route("PUT", "/api/profile/me")
@requires()
def update_me(ctx):
    role = ctx.user["role"]
    collection = COLLECTION_FOR[role]
    patch = {k: ctx.body[k] for k in EDITABLE[role] if k in ctx.body}
    updated = store.update(collection, lambda p: p["userId"] == ctx.user["id"], patch)
    if not updated:
        raise ApiError(404, "Profile not found.")
    return {"profile": _decorate(updated, role)}


@route("GET", "/api/profile/candidate/:id")
@requires()
def get_candidate(ctx):
    profile = store.find("candidateProfiles", lambda p: p["id"] == ctx.params["id"])
    if not profile:
        raise ApiError(404, "Candidate not found.")
    if profile.get("visibility") == "private" and profile["userId"] != ctx.user["id"]:
        raise ApiError(403, "This profile is private.")
    return {"profile": _decorate(profile, "candidate")}
