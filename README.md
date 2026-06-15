# FutureLinked — TalentBank Career OS Challenge (Python edition)

A jobsite platform with a **University accountability layer**, localised for
**Malaysia** (Ringgit / RM, Malaysian employers, Universiti Teknologi PETRONAS
as the demo institution). It does the core jobsite job (sign up, build a CV,
find and apply to jobs, get matched) and extends it with three of TalentBank's
University reference modules, wired to live data.

The project is split into two clearly named folders:

```
python-app/
├── frontend/     <-- the website you see in the browser (HTML, CSS, JavaScript)
├── backend/      <-- the Python server + all the logic and data
├── tests/        <-- unit tests
└── requirements.txt
```

| Module | TalentBank ref | What it does here |
| --- | --- | --- |
| 🎓 **Lifelong Outcome Loop** | University · 01 | Tracks where graduates land for *years* — by cohort, program and employer. |
| 📡 **Adaptive Readiness Profile** | University · 03 | Turns "ready for the world" into a *live signal* from each student's skills, projects and internships, with an early-warning flag. |
| 💞 **Live Internship Marketplace** | University · 04 | Matches students to internships with explainable scores and tracks which placements *led somewhere*. |
| 📚 Skills-gap signal | *(bonus)* | Compares live market demand against what the cohort knows — a curriculum signal from hiring data. |

Guiding principle from the brief: **navigation, not prediction. No black-box
scores.** Every match ships with plain-English reasons and an uncertainty note.

---

## Run it (in VS Code or any terminal)

You only need **Python 3.8+**. There is **nothing to pip install** — the whole
backend runs on the Python standard library.

1. Open the `python-app` folder in VS Code.
2. Open a terminal and run:

   ```bash
   cd backend
   python app.py
   ```

   (On some systems use `python3 app.py`.)

3. Open **http://localhost:3000** in your browser.

Demo data is created automatically the first time you run it.

### Other commands

```bash
python -m unittest discover tests   # run the unit tests (from python-app/)
python backend/seed.py              # wipe and rebuild the demo data
```

### Demo logins (password for all: `password123`)

| Role | Email | What you'll see |
| --- | --- | --- |
| 🎓 University | `careers@utp.edu.my` | The three University modules with a full UTP cohort. |
| 🎯 Candidate | `amirah@utp.edu.my` | CV builder, matched jobs, applications, career paths. |
| 🏢 Employer | `talent@helix.com.my` | Post jobs, ranked applicants, view submitted CVs, talent search. |

On the sign-in screen, click any demo login to auto-fill it. You can also
register a new account in any of the three roles.

---

## Core jobsite features (Step 1 checklist)

- ✅ Sign up & register (candidate / employer / university), token auth, PBKDF2-hashed passwords.
- ✅ **CV / resume builder** — personal info (email, H/P number, location, LinkedIn),
  Education (required), Past projects, Work experience, Skills — plus an AI "resume polish" assist.
- ✅ Job listings · ✅ Job matching (explainable, both directions).
- ✅ **Per-job application form** — expected salary (RM), work arrangement (remote / on-site /
  hybrid), preferred location, earliest start date, and a required accuracy declaration. The
  candidate's CV is **attached automatically** to every application.
- ✅ **Employer review** — separate view-only buttons for the submitted application form and the CV.
- ✅ Keyword & job search (keyword, skill, location, type, remote, internship).
- ✅ Candidate dashboard · ✅ Employer dashboard · ✅ University dashboard.

## Collaboration features (candidate ↔ employer)

- 💬 **Chat** — 1:1 messaging. An employer can start a chat from *Find talent* or an
  applicant card; the candidate can reply only after the employer messages first (spam-free).
  Incoming chat is **not** turned into bell notifications.
- 📅 **Calendar** — each user keeps a personal daily schedule (click a day to add entries).
- 🔔 **Notifications** — a bell in the top-right. Candidates are notified of application
  status changes (offer / reject / interview); employers are notified of new applications
  and interview accept/decline responses. Chat is excluded by design.
- 🗓 **Interview scheduling** — the employer pipeline replaces the status dropdown with three
  actions: **Offer**, **Reject** (both ask Confirm/Cancel), and **Interview**. Interview opens
  a calendar that marks the candidate's **busy days** (dates only — the schedule details stay
  private) so the employer can pick a sensible date; the final choice is the employer's.
- ✅ **Interview response** — the candidate accepts or declines a proposed interview
  (declining requires a reason); both actions ask Confirm/Cancel and notify the employer.

---

## How it's built

**Backend (`backend/`)** — pure Python standard library:

| File | Responsibility |
| --- | --- |
| `app.py` | HTTP server, request routing, static + SPA serving (entry point) |
| `framework.py` | tiny router + request-context + typed errors |
| `store.py` | JSON-file datastore (swap for a real DB later) |
| `security.py` | PBKDF2 password hashing + signed session tokens + auth decorator |
| `matching.py` | explainable match scoring (the core engine) |
| `readiness.py` | Adaptive Readiness Profile signal |
| `ai.py` | Claude integration (via `urllib`) + transparent heuristic fallback |
| `seed.py` | demo world (university, employers, students, outcomes) |
| `api/` | endpoint handlers: auth, profile, jobs, applications, university, ai |

**Frontend (`frontend/`)** — plain HTML, CSS and JavaScript (no build step, no
framework). It talks to the backend over the `/api/*` JSON endpoints.

**Why a standard-library server and a JSON file store?** So the app runs with a
single command and zero installs — the most reliable way for a reviewer to open
the folder and click through it. The datastore exposes a small surface
(`all_rows / where / find / insert / update / remove`), so moving to a real
database later is a contained change.

---

## AI craft

`backend/ai.py` powers two features:

1. **Career paths** — given a candidate's *shape*, it surfaces a *range* of
   realistic next moves with the trade-off of each and an honest uncertainty
   note. A map, not a forecast.
2. **Resume polish** — turns rough notes into crisp, outcome-oriented bullets.

Both call **Anthropic's Claude** when an `ANTHROPIC_API_KEY` is set, and fall
back to a deterministic, explainable heuristic so the app is fully functional
with zero configuration. The UI labels which one produced each result.

```bash
# optional — enables live Claude generation
export ANTHROPIC_API_KEY=sk-ant-...
export CAREER_OS_MODEL=claude-fable-5   # optional override
cd backend && python app.py
```

---

## Security notes

- Passwords are salted and hashed with PBKDF2-HMAC-SHA256; sessions are
  HMAC-signed, expiring tokens (`Authorization: Bearer`).
- Every protected route is role-gated by the `@requires(role)` decorator.
- Profile updates are field-whitelisted, so clients can't write arbitrary keys.
- Candidate visibility (`open` / `passive` / `private`) is enforced server-side:
  private profiles never appear in employer search.
- Static file serving guards against path traversal outside `frontend/`.
- The token secret is read from `JWT_SECRET`; the dev fallback exists only so
  the prototype boots with no configuration — set a real one for any deployment.

---

## Concept brief (for the Intent Form)

**Audience:** Universities (primary), with the candidate and employer sides
fully built because a university's accountability layer is only as good as the
live marketplace underneath it.

Universities lose sight of students the moment they graduate, judge "readiness"
by a date on a certificate, and run internships through scattered job boards
they can't measure. Career OS fixes all three on top of a working jobsite. The
**Lifelong Outcome Loop** keeps tracking graduates for years and feeds real
outcomes back into program decisions. The **Adaptive Readiness Profile** makes
readiness a live, four-dimension signal that flags students who need help
*before* it's too late. The **Live Internship Marketplace** matches students to
internships with explainable scores and tracks which placements actually led
somewhere. A bonus skills-gap view compares live hiring demand to what the
cohort knows, turning the job market into a curriculum signal. Throughout, the
product keeps its promise: it navigates, it explains, and it never pretends to
predict.
