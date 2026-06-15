"""1:1 chat between employers and candidates.

Gating rule (keeps the channel spam-free, per the brief):
  * an employer may message any candidate,
  * a candidate may only reply once an employer has messaged them first.

Chat does not create bell notifications — unread chat is surfaced in the
Messages screen itself.
"""

from datetime import datetime, timezone

import store
from framework import route, ApiError
from security import requires


def _thread_key(a, b):
    return "|".join(sorted([a, b]))


def _user_brief(user_id):
    u = store.find("users", lambda x: x["id"] == user_id)
    if not u:
        return {"id": user_id, "name": "Unknown", "role": ""}
    return {"id": u["id"], "name": u["name"], "role": u["role"]}


def _thread_has_employer_opener(key, candidate_user_id):
    """True if someone other than the candidate (i.e. the employer) has written."""
    msgs = store.where("messages", lambda m: m["threadKey"] == key)
    return any(m["fromUserId"] != candidate_user_id for m in msgs)


@route("GET", "/api/messages/threads")
@requires(["employer", "candidate"])
def threads(ctx):
    me = ctx.user["id"]
    mine = store.where("messages", lambda m: ctx.user["id"] in (m["fromUserId"], m["toUserId"]))
    by_other = {}
    for m in sorted(mine, key=lambda x: x["createdAt"]):
        other = m["toUserId"] if m["fromUserId"] == me else m["fromUserId"]
        by_other[other] = {
            "other": _user_brief(other),
            "lastMessage": m["body"],
            "lastAt": m["createdAt"],
            "unread": False,
        }
    # Mark a thread unread if the latest message was sent to me.
    for other, t in by_other.items():
        last = max(
            store.where("messages", lambda m: m["threadKey"] == _thread_key(me, other)),
            key=lambda x: x["createdAt"],
        )
        t["unread"] = (last["toUserId"] == me)
    result = sorted(by_other.values(), key=lambda t: t["lastAt"], reverse=True)
    return {"threads": result}


@route("GET", "/api/messages/thread/:userId")
@requires(["employer", "candidate"])
def thread(ctx):
    me = ctx.user["id"]
    other = ctx.params["userId"]
    key = _thread_key(me, other)
    msgs = sorted(
        store.where("messages", lambda m: m["threadKey"] == key),
        key=lambda x: x["createdAt"],
    )
    can_reply = ctx.user["role"] == "employer" or _thread_has_employer_opener(key, me)
    return {
        "messages": [{"mine": m["fromUserId"] == me, "body": m["body"], "at": m["createdAt"]} for m in msgs],
        "other": _user_brief(other),
        "canReply": can_reply,
    }


@route("POST", "/api/messages")
@requires(["employer", "candidate"])
def send(ctx):
    me = ctx.user["id"]
    to = ctx.body.get("toUserId")
    body = (ctx.body.get("body") or "").strip()
    if not to or not body:
        raise ApiError(400, "A recipient and a message are required.")
    recipient = store.find("users", lambda u: u["id"] == to)
    if not recipient:
        raise ApiError(404, "Recipient not found.")

    key = _thread_key(me, to)
    # Candidates can only reply after an employer opens the conversation.
    if ctx.user["role"] == "candidate" and not _thread_has_employer_opener(key, me):
        raise ApiError(403, "You can only reply once an employer has messaged you.")
    # Chat is only ever employer <-> candidate.
    if {ctx.user["role"], recipient["role"]} != {"employer", "candidate"}:
        raise ApiError(403, "Chat is only between employers and candidates.")

    message = store.insert("messages", {
        "threadKey": key,
        "fromUserId": me,
        "toUserId": to,
        "body": body,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })
    return 201, {"message": {"mine": True, "body": message["body"], "at": message["createdAt"]}}
