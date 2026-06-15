"""Tiny web framework on top of Python's standard library.

No Flask, no third-party packages — so the app runs with a bare
`python app.py` and nothing to install. This module provides:

  * a `Router` that maps (METHOD, URL-pattern) to handler functions,
  * `@route(...)` / `@requires(...)` decorators,
  * a `Ctx` request-context object (parsed JSON body, path params, query,
    and the authenticated user),
  * an `ApiError` for clean, typed error responses.

Handlers return a plain dict (sent as 200 JSON) or a `(status, dict)` tuple.
"""

import re


class ApiError(Exception):
    """Raise to return a JSON error with a specific HTTP status."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


class Ctx:
    """Everything a handler needs about the current request."""

    def __init__(self, body=None, params=None, query=None):
        self.body = body or {}
        self.params = params or {}
        self.query = query or {}
        self.user = None  # populated by @requires when authenticated


class Router:
    """Ordered list of routes; first match wins (register specific routes first)."""

    def __init__(self):
        self._routes = []  # (method, compiled_regex, handler)

    def add(self, method, pattern, handler):
        # Convert "/api/jobs/:id" style into a named-group regex.
        regex = re.sub(r":([A-Za-z_]+)", r"(?P<\1>[^/]+)", pattern)
        self._routes.append((method.upper(), re.compile(f"^{regex}$"), handler))

    def match(self, method, path):
        """Return (handler, params) or (None, None) if no path matched.

        Raises ApiError(405) if the path matched but not for this method.
        """
        path_matched = False
        for m, regex, handler in self._routes:
            found = regex.match(path)
            if found:
                path_matched = True
                if m == method.upper():
                    return handler, found.groupdict()
        if path_matched:
            raise ApiError(405, "Method not allowed.")
        return None, None


# A single shared router the api modules register against.
router = Router()


def route(method, pattern):
    """Decorator: register a handler for an HTTP method + path pattern."""

    def wrap(fn):
        router.add(method, pattern, fn)
        return fn

    return wrap
