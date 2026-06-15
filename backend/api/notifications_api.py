"""In-app notification bell.

Lists notifications for the current user and lets them be marked read. Created
by other features via backend/notify.py (applications, interview responses).
Incoming chat is intentionally excluded.
"""

import store
from framework import route
from security import requires


@route("GET", "/api/notifications")
@requires(["employer", "candidate"])
def list_notifications(ctx):
    items = store.where("notifications", lambda n: n["userId"] == ctx.user["id"])
    items.sort(key=lambda n: n["createdAt"], reverse=True)
    unread = len([n for n in items if not n["read"]])
    return {"notifications": items, "unread": unread}


@route("POST", "/api/notifications/read-all")
@requires(["employer", "candidate"])
def mark_all_read(ctx):
    for n in store.where("notifications", lambda n: n["userId"] == ctx.user["id"] and not n["read"]):
        store.update("notifications", lambda x: x["id"] == n["id"], {"read": True})
    return {"ok": True}
