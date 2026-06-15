"""Career OS — application entry point.

A self-contained HTTP server built on Python's standard library. It:
  * serves the JSON API under /api/* (routes live in the `api` package),
  * serves the static frontend (../frontend) for everything else,
  * falls back to index.html so the single-page app's client routing works.

Run it with no setup at all:

    python app.py            # -> http://localhost:3000

No pip install required. Demo data is seeded automatically on first boot.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# Make sibling modules importable no matter where the server is launched from.
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from framework import router, Ctx, ApiError  # noqa: E402
from seed import ensure_seeded               # noqa: E402
import api  # noqa: E402,F401  (importing registers all routes)

FRONTEND_DIR = os.path.join(HERE, "..", "frontend")
PORT = int(os.environ.get("PORT", "3000"))

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".png": "image/png",
}


class Handler(BaseHTTPRequestHandler):
    # Quieter, single-line request logging.
    def log_message(self, fmt, *args):
        sys.stderr.write(f"  {self.command} {self.path}\n")

    # All verbs funnel through one dispatcher.
    def do_GET(self):
        self._dispatch()

    def do_POST(self):
        self._dispatch()

    def do_PUT(self):
        self._dispatch()

    def do_PATCH(self):
        self._dispatch()

    def do_DELETE(self):
        self._dispatch()

    # --- core ---------------------------------------------------------------
    def _dispatch(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith("/api/"):
            self._handle_api(path, parsed.query)
        else:
            self._serve_static(path)

    def _handle_api(self, path, query_string):
        if path == "/api/health":
            return self._send_json(200, {"status": "ok"})
        try:
            handler, params = router.match(self.command, path)
            if not handler:
                return self._send_json(404, {"error": "Not found."})

            ctx = Ctx(
                body=self._read_json_body(),
                params=params,
                query={k: v[0] for k, v in parse_qs(query_string).items()},
            )
            auth = self.headers.get("Authorization", "")
            ctx._bearer = auth[7:] if auth.startswith("Bearer ") else None

            result = handler(ctx)
            status, payload = result if isinstance(result, tuple) else (200, result)
            self._send_json(status, payload)
        except ApiError as err:
            self._send_json(err.status, {"error": err.message})
        except Exception as err:  # noqa: BLE001
            sys.stderr.write(f"  ERROR {self.command} {path}: {err}\n")
            self._send_json(500, {"error": "Something went wrong on the server."})

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return {}

    def _serve_static(self, path):
        rel = "index.html" if path in ("/", "") else path.lstrip("/")
        target = os.path.normpath(os.path.join(FRONTEND_DIR, rel))

        # Prevent path traversal outside the frontend directory.
        if not target.startswith(os.path.normpath(FRONTEND_DIR)):
            return self._send_json(403, {"error": "Forbidden."})

        # SPA fallback: unknown non-file routes serve the app shell.
        if not os.path.isfile(target):
            target = os.path.join(FRONTEND_DIR, "index.html")

        try:
            with open(target, "rb") as fh:
                body = fh.read()
        except OSError:
            return self._send_json(404, {"error": "Not found."})

        ext = os.path.splitext(target)[1]
        self.send_response(200)
        self.send_header("Content-Type", CONTENT_TYPES.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    ensure_seeded()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"\n  FutureLinked running at  http://localhost:{PORT}")
    print("  Demo logins are listed on the sign-in screen.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Shutting down.")
        server.shutdown()


if __name__ == "__main__":
    main()
