"""Tiny JSON-file datastore.

Chosen over SQLite/Postgres so the prototype runs anywhere Python does — no
database to install, no setup. The whole database lives in
`backend/data/db.json` and is held in memory; every mutation is persisted
synchronously, which is fine at prototype scale.

Swapping for a real database later only means re-implementing the small
surface below (all_rows / where / find / insert / update / remove).
"""

import json
import os
import uuid

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_FILE = os.path.join(DATA_DIR, "db.json")

COLLECTIONS = [
    "users",
    "candidateProfiles",
    "employerProfiles",
    "universityProfiles",
    "jobs",
    "applications",
    "outcomes",      # Lifelong Outcome Loop records
    "placements",    # Live Internship Marketplace placements
    "messages",      # 1:1 chat messages (employer <-> candidate)
    "scheduleEvents",  # personal calendar entries
    "notifications",   # in-app notifications (not for incoming chat)
]

_cache = None


def _empty():
    return {name: [] for name in COLLECTIONS}


def _load():
    global _cache
    if _cache is not None:
        return _cache
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as fh:
                _cache = json.load(fh)
        except (json.JSONDecodeError, OSError):
            _cache = _empty()
        for name in COLLECTIONS:  # tolerate older files missing new collections
            _cache.setdefault(name, [])
    else:
        _cache = _empty()
    return _cache


def _persist():
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DB_FILE, "w", encoding="utf-8") as fh:
        json.dump(_cache, fh, indent=2)


def _check(collection):
    if collection not in COLLECTIONS:
        raise ValueError(f"Unknown collection: {collection}")


def new_id():
    return uuid.uuid4().hex


def all_rows(collection):
    """Return all rows in a collection (a shallow copy)."""
    _check(collection)
    return list(_load()[collection])


def where(collection, predicate):
    """Return all rows matching a predicate."""
    _check(collection)
    return [row for row in _load()[collection] if predicate(row)]


def find(collection, predicate):
    """Return the first row matching a predicate, or None."""
    _check(collection)
    for row in _load()[collection]:
        if predicate(row):
            return row
    return None


def insert(collection, row):
    """Insert a row, auto-assigning an id if absent. Returns the row."""
    _check(collection)
    record = {"id": row.get("id") or new_id(), **row}
    _load()[collection].append(record)
    _persist()
    return record


def update(collection, predicate, patch):
    """Patch the first row matching the predicate. Returns the updated row."""
    _check(collection)
    row = find(collection, predicate)
    if not row:
        return None
    row.update(patch)
    _persist()
    return row


def remove(collection, predicate):
    """Remove rows matching the predicate. Returns the count removed."""
    _check(collection)
    data = _load()
    before = len(data[collection])
    data[collection] = [r for r in data[collection] if not predicate(r)]
    _persist()
    return before - len(data[collection])


def replace_all(next_db):
    """Replace the entire database (used by the seeder)."""
    global _cache
    _cache = {**_empty(), **next_db}
    _persist()
    return _cache


def is_empty():
    data = _load()
    for name in COLLECTIONS:
        if data[name]:
            return False
    return True
