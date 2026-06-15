"""Authentication: password hashing and stateless session tokens.

Implemented with the standard library only:
  * passwords are salted and hashed with PBKDF2-HMAC-SHA256 (`hashlib`),
  * sessions are compact signed tokens (header.payload.signature, base64url),
    signed with HMAC-SHA256 — the same shape as a JWT, without a dependency.

The signing secret comes from the environment in production; the fallback
exists only so the prototype boots with zero configuration.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from functools import wraps

from framework import ApiError
import store

SECRET = os.environ.get("JWT_SECRET", "talentbank-career-os-dev-secret-change-me").encode()
TOKEN_TTL_SECONDS = 7 * 24 * 3600
PBKDF2_ROUNDS = 120_000


# --- Passwords -------------------------------------------------------------
def hash_password(plain):
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${PBKDF2_ROUNDS}${salt.hex()}${digest.hex()}"


def verify_password(plain, stored):
    try:
        _, rounds, salt_hex, digest_hex = stored.split("$")
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac("sha256", plain.encode(), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(expected, actual)
    except (ValueError, AttributeError):
        return False


# --- Tokens ----------------------------------------------------------------
def _b64(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _unb64(text):
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def issue_token(user):
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64(
        json.dumps(
            {
                "sub": user["id"],
                "role": user["role"],
                "email": user["email"],
                "exp": int(time.time()) + TOKEN_TTL_SECONDS,
            }
        ).encode()
    )
    signing_input = f"{header}.{payload}".encode()
    sig = _b64(hmac.new(SECRET, signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def decode_token(token):
    try:
        header, payload, sig = token.split(".")
        expected = _b64(hmac.new(SECRET, f"{header}.{payload}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(expected, sig):
            return None
        data = json.loads(_unb64(payload))
        if data.get("exp", 0) < int(time.time()):
            return None
        return data
    except (ValueError, json.JSONDecodeError):
        return None


# --- Auth decorator --------------------------------------------------------
def requires(roles=None):
    """Decorate a handler so it only runs for an authenticated user.

    Pass a role string or list to restrict to specific account types.
    The decorated handler reads the user from `ctx.user`.
    """
    allowed = [roles] if isinstance(roles, str) else roles

    def wrap(fn):
        @wraps(fn)
        def inner(ctx):
            token = getattr(ctx, "_bearer", None)
            if not token:
                raise ApiError(401, "Authentication required.")
            payload = decode_token(token)
            if not payload:
                raise ApiError(401, "Session expired or invalid.")
            user = store.find("users", lambda u: u["id"] == payload["sub"])
            if not user:
                raise ApiError(401, "Account not found.")
            if allowed and user["role"] not in allowed:
                raise ApiError(403, "You do not have access to this resource.")
            ctx.user = {"id": user["id"], "role": user["role"], "email": user["email"]}
            return fn(ctx)

        return inner

    return wrap
