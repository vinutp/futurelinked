"""Auth endpoints: register, login, current user."""

import re
from datetime import datetime, timezone

import store
from framework import route, ApiError
from security import hash_password, verify_password, issue_token, requires

VALID_ROLES = ("candidate", "employer", "university")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _public_user(user):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}


def _seed_empty_profile(user):
    if user["role"] == "candidate":
        store.insert("candidateProfiles", {
            "userId": user["id"], "name": user["name"], "headline": "",
            "email": user["email"], "phone": "", "linkedin": "", "location": "",
            "seniority": "junior", "desiredType": "", "summary": "", "skills": [],
            "education": [], "projects": [], "experience": [], "universityId": None,
            "readiness": {"signals": []}, "visibility": "open",
        })
    elif user["role"] == "employer":
        store.insert("employerProfiles", {
            "userId": user["id"], "companyName": user["name"], "industry": "",
            "location": "", "about": "", "website": "",
        })
    elif user["role"] == "university":
        store.insert("universityProfiles", {
            "userId": user["id"], "name": user["name"], "country": "", "programs": [],
        })


@route("POST", "/api/auth/register")
def register(ctx):
    body = ctx.body
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip()
    role = body.get("role")

    if not EMAIL_RE.match(email):
        raise ApiError(400, "A valid email is required.")
    if len(password) < 6:
        raise ApiError(400, "Password must be at least 6 characters.")
    if not name:
        raise ApiError(400, "Name is required.")
    if role not in VALID_ROLES:
        raise ApiError(400, "Role must be candidate, employer, or university.")
    if store.find("users", lambda u: u["email"].lower() == email.lower()):
        raise ApiError(409, "An account with that email already exists.")

    user = store.insert("users", {
        "email": email.lower(), "name": name, "role": role,
        "passwordHash": hash_password(password),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })
    _seed_empty_profile(user)
    return 201, {"token": issue_token(user), "user": _public_user(user)}


@route("POST", "/api/auth/login")
def login(ctx):
    email = (ctx.body.get("email") or "").lower()
    password = ctx.body.get("password") or ""
    user = store.find("users", lambda u: u["email"] == email)
    if not user or not verify_password(password, user["passwordHash"]):
        raise ApiError(401, "Invalid email or password.")
    return {"token": issue_token(user), "user": _public_user(user)}


@route("GET", "/api/auth/me")
@requires()
def me(ctx):
    user = store.find("users", lambda u: u["id"] == ctx.user["id"])
    return {"user": _public_user(user)}
