"""In-app notifications helper.

A single place to create notifications so every feature records them the same
way. Chat messages deliberately do NOT call this — incoming chat is shown in
the Messages screen, not the notification bell (per product spec).
"""

from datetime import datetime, timezone

import store


def push(user_id, kind, text, link=None):
    """Create a notification for a recipient user.

    kind: 'application' | 'status' | 'interview' | 'interview-response'
    link: optional in-app hash route the bell can deep-link to.
    """
    return store.insert("notifications", {
        "userId": user_id,
        "kind": kind,
        "text": text,
        "link": link or "",
        "read": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })


def unread_count(user_id):
    return len(store.where("notifications", lambda n: n["userId"] == user_id and not n["read"]))
