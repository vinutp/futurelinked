"""Demo seed (Malaysia).

Builds a small but believable world so a reviewer who logs in sees a populated
product: Universiti Teknologi PETRONAS with a cohort of students, Malaysian
employers with live job and internship listings, applications in flight (each
carrying a submitted application form + CV snapshot), and years of graduate
outcome history for the Lifelong Outcome Loop.

Salaries are in Malaysian Ringgit (RM) — annual for full-time roles, monthly
for internships. Run `python seed.py` to wipe and rebuild. The server also
auto-seeds on first boot if the database is empty.
"""

from datetime import datetime, timedelta, timezone

import store
from security import hash_password

DEMO_PASSWORD = "password123"

# Fields copied into an application's CV snapshot (mirror of applications_api).
CV_FIELDS = ["name", "email", "phone", "linkedin", "location", "headline",
             "summary", "skills", "education", "projects", "experience"]


def _iso(days_ago=0):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


def build_seed():
    users, candidate_profiles, employer_profiles, university_profiles = [], [], [], []
    jobs, applications, outcomes, placements = [], [], [], []

    pw = hash_password(DEMO_PASSWORD)
    counter = {"n": 0}

    def nid(prefix):
        counter["n"] += 1
        return f"{prefix}_{counter['n']}"

    # --- University --------------------------------------------------------
    uni_user = {
        "id": nid("u"),
        "email": "careers@utp.edu.my",
        "name": "Universiti Teknologi PETRONAS",
        "role": "university",
        "passwordHash": pw,
        "createdAt": _iso(400),
    }
    users.append(uni_user)
    uni = {
        "id": nid("uni"),
        "userId": uni_user["id"],
        "name": "Universiti Teknologi PETRONAS",
        "country": "Malaysia",
        "programs": [
            "BSc Computer Science",
            "BSc Information Technology",
            "BEng Software Engineering",
            "BSc Business Information Systems",
        ],
    }
    university_profiles.append(uni)

    # --- Employers ---------------------------------------------------------
    employer_defs = [
        {"email": "talent@helix.com.my", "company": "Helix Software", "industry": "Software", "location": "Kuala Lumpur, Malaysia"},
        {"email": "hiring@brightdata.com.my", "company": "BrightData", "industry": "Data & Analytics", "location": "Cyberjaya, Malaysia"},
        {"email": "people@northstar.my", "company": "Northstar Design", "industry": "Product Design", "location": "Remote"},
    ]
    employers = []
    for e in employer_defs:
        user = {
            "id": nid("u"),
            "email": e["email"],
            "name": e["company"],
            "role": "employer",
            "passwordHash": pw,
            "createdAt": _iso(120),
        }
        users.append(user)
        profile = {
            "id": nid("emp"),
            "userId": user["id"],
            "companyName": e["company"],
            "industry": e["industry"],
            "location": e["location"],
            "about": f"{e['company']} is a {e['industry'].lower()} company hiring graduates and experienced talent across Malaysia.",
            "website": "",
        }
        employer_profiles.append(profile)
        employers.append({"user": user, "profile": profile})

    # --- Candidates / students --------------------------------------------
    student_defs = [
        {
            "name": "Amirah Hashim", "email": "amirah@utp.edu.my", "phone": "012-345 6789",
            "linkedin": "linkedin.com/in/amirahhashim",
            "headline": "Final-year Computer Science student",
            "location": "Kuala Lumpur, Malaysia", "seniority": "junior", "desiredType": "Full-time",
            "skills": ["JavaScript", "React", "Node.js", "SQL", "Git", "TypeScript"],
            "program": "BSc Computer Science",
            "summary": "Final-year CS student who loves building web products. Shipped two hackathon wins and a campus events app used by 800 students.",
            "education": [{"institution": "Universiti Teknologi PETRONAS", "fieldOfStudy": "BSc Computer Science", "startYear": "2022", "endYear": "2026"}],
            "projects": [{"name": "Campus Events App", "description": "Full-stack React/Node app for UTP societies, 800 active users."}],
            "experience": [
                {"title": "Software Engineering Intern", "organisation": "Helix Software", "type": "internship", "period": "Jun–Aug 2025", "description": "Built internal dashboard features in React."},
            ],
        },
        {
            "name": "Wei Jie Tan", "email": "weijie@utp.edu.my", "phone": "016-228 1190",
            "linkedin": "linkedin.com/in/weijietan",
            "headline": "Information Technology student, ML focus",
            "location": "Cyberjaya, Malaysia", "seniority": "junior", "desiredType": "Internship",
            "skills": ["Python", "Pandas", "SQL", "Machine Learning", "Statistics"],
            "program": "BSc Information Technology",
            "summary": "Third-year IT student focused on applied ML. Comfortable taking a messy dataset to a deployed model.",
            "education": [{"institution": "Universiti Teknologi PETRONAS", "fieldOfStudy": "BSc Information Technology", "startYear": "2023", "endYear": "2027"}],
            "projects": [{"name": "Churn Prediction Model", "description": "Built a churn classifier achieving strong recall on a telco dataset."}],
            "experience": [{"title": "Research Assistant", "organisation": "UTP Data Lab", "type": "project", "period": "2025", "description": "Built churn models."}],
        },
        {
            "name": "Priya Subramaniam", "email": "priya@utp.edu.my", "phone": "011-2378 4521",
            "linkedin": "linkedin.com/in/priyasubramaniam",
            "headline": "Software Engineering student",
            "location": "Kuala Lumpur, Malaysia", "seniority": "junior", "desiredType": "Full-time",
            "skills": ["Java", "Spring", "SQL", "Git", "Docker"],
            "program": "BEng Software Engineering",
            "summary": "Backend-leaning engineer who enjoys clean APIs and systems work.",
            "education": [{"institution": "Universiti Teknologi PETRONAS", "fieldOfStudy": "BEng Software Engineering", "startYear": "2022", "endYear": "2026"}],
            "projects": [],
            "experience": [{"title": "Backend Intern", "organisation": "BrightData", "type": "internship", "period": "Jun–Aug 2025", "description": "Shipped REST endpoints."}],
        },
        {
            "name": "Daniel Lim", "email": "daniel@utp.edu.my", "phone": "017-661 0042",
            "linkedin": "linkedin.com/in/daniellim",
            "headline": "CS student exploring product",
            "location": "Petaling Jaya, Malaysia", "seniority": "junior", "desiredType": "Internship",
            "skills": ["JavaScript", "React", "Figma"],
            "program": "BSc Computer Science",
            "summary": "Curious developer drawn to the line between engineering and design.",
            "education": [{"institution": "Universiti Teknologi PETRONAS", "fieldOfStudy": "BSc Computer Science", "startYear": "2024", "endYear": "2028"}],
            "projects": [],
            "experience": [],
        },
        {
            "name": "Nur Sofia Aziz", "email": "sofia@utp.edu.my", "phone": "013-908 7766",
            "linkedin": "linkedin.com/in/nursofia",
            "headline": "Business Information Systems student",
            "location": "Remote", "seniority": "junior", "desiredType": "Internship",
            "skills": ["Figma", "User Research", "Prototyping", "UI Design"],
            "program": "BSc Business Information Systems",
            "summary": "Designer focused on accessible, research-led product work.",
            "education": [{"institution": "Universiti Teknologi PETRONAS", "fieldOfStudy": "BSc Business Information Systems", "startYear": "2023", "endYear": "2027"}],
            "projects": [{"name": "Onboarding Redesign", "description": "Redesigned a client onboarding flow during an internship."}],
            "experience": [{"title": "Design Intern", "organisation": "Northstar Design", "type": "internship", "period": "2025", "description": "Redesigned onboarding flow."}],
        },
        {
            "name": "Faiz Rahman", "email": "faiz@utp.edu.my", "phone": "019-554 3321",
            "linkedin": "",
            "headline": "First-year CS student",
            "location": "George Town, Penang", "seniority": "intern", "desiredType": "Internship",
            "skills": ["Python"],
            "program": "BSc Computer Science",
            "summary": "",
            "education": [{"institution": "Universiti Teknologi PETRONAS", "fieldOfStudy": "BSc Computer Science", "startYear": "2025", "endYear": "2029"}],
            "projects": [],
            "experience": [],
        },
    ]

    students = []
    for s in student_defs:
        user = {
            "id": nid("u"),
            "email": s["email"],
            "name": s["name"],
            "role": "candidate",
            "passwordHash": pw,
            "createdAt": _iso(90),
        }
        users.append(user)
        profile = {
            "id": nid("cand"),
            "userId": user["id"],
            "name": s["name"],
            "email": s["email"],
            "phone": s["phone"],
            "linkedin": s["linkedin"],
            "headline": s["headline"],
            "location": s["location"],
            "seniority": s["seniority"],
            "desiredType": s["desiredType"],
            "summary": s["summary"],
            "skills": s["skills"],
            "education": s["education"],
            "projects": s["projects"],
            "experience": s["experience"],
            "universityId": uni["id"],
            "program": s["program"],
            "readiness": {"signals": []},
            "visibility": "open",
        }
        candidate_profiles.append(profile)
        students.append({"user": user, "profile": profile})

    # --- Jobs & internships (RM: annual full-time, monthly intern) ---------
    helix, brightdata, northstar = employers
    job_defs = [
        {"emp": helix, "title": "Graduate Frontend Engineer", "type": "Full-time", "seniority": "junior",
         "location": "Kuala Lumpur, Malaysia", "remote": False, "internship": False, "salaryMin": 42000, "salaryMax": 54000,
         "skills": ["JavaScript", "React", "TypeScript", "Git"],
         "desc": "Join our product team building customer-facing web apps. Great mentorship for new grads.", "days": 3},
        {"emp": helix, "title": "Software Engineering Intern", "type": "Internship", "seniority": "intern",
         "location": "Kuala Lumpur, Malaysia", "remote": False, "internship": True, "salaryMin": 1200, "salaryMax": 1600,
         "skills": ["JavaScript", "React", "Node.js", "Git"],
         "desc": "12-week internship working alongside our platform team. Convert-to-grad-role potential.", "days": 6},
        {"emp": brightdata, "title": "Junior Data Scientist", "type": "Full-time", "seniority": "junior",
         "location": "Cyberjaya, Malaysia", "remote": True, "internship": False, "salaryMin": 48000, "salaryMax": 60000,
         "skills": ["Python", "Pandas", "SQL", "Machine Learning", "Statistics"],
         "desc": "Work on real customer datasets, from exploration to deployed models.", "days": 1},
        {"emp": brightdata, "title": "Data Science Intern", "type": "Internship", "seniority": "intern",
         "location": "Cyberjaya, Malaysia", "remote": True, "internship": True, "salaryMin": 1000, "salaryMax": 1400,
         "skills": ["Python", "Pandas", "SQL", "Statistics"],
         "desc": "Internship on the analytics team. Mentored project with a real deliverable.", "days": 5},
        {"emp": brightdata, "title": "Backend Engineer (Graduate)", "type": "Full-time", "seniority": "junior",
         "location": "George Town, Penang", "remote": False, "internship": False, "salaryMin": 42000, "salaryMax": 54000,
         "skills": ["Java", "Spring", "SQL", "Docker"],
         "desc": "Build the APIs behind our data platform. Strong fundamentals matter more than years.", "days": 8},
        {"emp": northstar, "title": "Product Design Intern", "type": "Internship", "seniority": "intern",
         "location": "Remote", "remote": True, "internship": True, "salaryMin": 900, "salaryMax": 1300,
         "skills": ["Figma", "User Research", "Prototyping", "UI Design"],
         "desc": "Help design real client products end-to-end, with a senior designer mentor.", "days": 2},
    ]
    job_records = []
    for j in job_defs:
        job = {
            "id": nid("job"),
            "employerId": j["emp"]["user"]["id"],
            "title": j["title"],
            "company": j["emp"]["profile"]["companyName"],
            "location": j["location"],
            "type": j["type"],
            "seniority": j["seniority"],
            "remote": j["remote"],
            "isInternship": j["internship"],
            "salaryMin": j["salaryMin"],
            "salaryMax": j["salaryMax"],
            "description": j["desc"],
            "requiredSkills": j["skills"],
            "postedAt": _iso(j["days"]),
        }
        jobs.append(job)
        job_records.append(job)

    # --- Applications in flight (with submitted form + CV snapshot) --------
    def snapshot(student):
        return {k: student["profile"].get(k) for k in CV_FIELDS}

    app_defs = [
        {"cand": students[0], "job": job_records[0], "status": "interview", "days": 2,
         "salary": 4200, "arrangement": "Hybrid", "start": "2026-07-01"},
        {"cand": students[0], "job": job_records[1], "status": "reviewing", "days": 4,
         "salary": 1500, "arrangement": "On-site", "start": "2026-06-20"},
        {"cand": students[1], "job": job_records[3], "status": "applied", "days": 1,
         "salary": 1300, "arrangement": "Remote", "start": "2026-07-15"},
        {"cand": students[2], "job": job_records[4], "status": "offer", "days": 9,
         "salary": 4500, "arrangement": "On-site", "start": "2026-08-01"},
        {"cand": students[4], "job": job_records[5], "status": "reviewing", "days": 1,
         "salary": 1200, "arrangement": "Remote", "start": "2026-07-01"},
    ]
    for a in app_defs:
        applications.append({
            "id": nid("app"),
            "jobId": a["job"]["id"],
            "candidateId": a["cand"]["user"]["id"],
            "candidateProfileId": a["cand"]["profile"]["id"],
            "coverNote": "Excited about this role and a strong fit for my skills.",
            "expectedSalary": a["salary"],
            "workArrangement": a["arrangement"],
            "preferredLocation": a["cand"]["profile"]["location"],
            "earliestStartDate": a["start"],
            "declaration": True,
            "resumeSnapshot": snapshot(a["cand"]),
            "status": a["status"],
            "matchScore": None,
            "appliedAt": _iso(a["days"]),
        })

    # --- Lifelong Outcome Loop: graduate outcome history (RM/year) ---------
    outcome_defs = [
        {"name": "Hannah Wong", "program": "BSc Computer Science", "gradYear": 2024, "status": "employed", "role": "Frontend Engineer", "employer": "Helix Software", "salary": 48000, "yearsTracked": 2},
        {"name": "Jamal Idris", "program": "BSc Computer Science", "gradYear": 2023, "status": "employed", "role": "Software Engineer", "employer": "Helix Software", "salary": 66000, "yearsTracked": 3},
        {"name": "Mei Ling Chong", "program": "BSc Information Technology", "gradYear": 2024, "status": "employed", "role": "Data Scientist", "employer": "BrightData", "salary": 56000, "yearsTracked": 2},
        {"name": "Oscar Tan", "program": "BSc Information Technology", "gradYear": 2022, "status": "employed", "role": "Senior Data Scientist", "employer": "BrightData", "salary": 84000, "yearsTracked": 4},
        {"name": "Fatimah Noor", "program": "BEng Software Engineering", "gradYear": 2023, "status": "employed", "role": "Backend Engineer", "employer": "GrabTech", "salary": 72000, "yearsTracked": 3},
        {"name": "Gurpreet Singh", "program": "BEng Software Engineering", "gradYear": 2024, "status": "further-study", "role": "MSc AI", "employer": None, "salary": None, "yearsTracked": 2},
        {"name": "Ivy Chan", "program": "BSc Business Information Systems", "gradYear": 2024, "status": "employed", "role": "Product Designer", "employer": "Northstar Design", "salary": 45000, "yearsTracked": 2},
        {"name": "Marcus Lee", "program": "BSc Business Information Systems", "gradYear": 2021, "status": "employed", "role": "Senior Product Designer", "employer": "Shopee", "salary": 96000, "yearsTracked": 5},
        {"name": "Nadia Iskandar", "program": "BSc Computer Science", "gradYear": 2021, "status": "employed", "role": "Engineering Manager", "employer": "Maybank", "salary": 132000, "yearsTracked": 5},
        {"name": "Brandon Yap", "program": "BSc Computer Science", "gradYear": 2025, "status": "employed", "role": "Graduate Engineer", "employer": "Helix Software", "salary": 45000, "yearsTracked": 1},
        {"name": "Lucy Abdullah", "program": "BSc Information Technology", "gradYear": 2025, "status": "seeking", "role": None, "employer": None, "salary": None, "yearsTracked": 1},
        {"name": "Raj Kumar", "program": "BEng Software Engineering", "gradYear": 2022, "status": "employed", "role": "Platform Engineer", "employer": "BrightData", "salary": 78000, "yearsTracked": 4},
    ]
    for o in outcome_defs:
        outcomes.append({"id": nid("out"), "universityId": uni["id"], **o})

    # --- Internship placements --------------------------------------------
    placement_defs = [
        {"student": "Amirah Hashim", "employer": "Helix Software", "role": "Software Engineering Intern", "ledSomewhere": True, "convertedToOffer": True, "days": 250},
        {"student": "Priya Subramaniam", "employer": "BrightData", "role": "Backend Intern", "ledSomewhere": True, "convertedToOffer": False, "days": 240},
        {"student": "Nur Sofia Aziz", "employer": "Northstar Design", "role": "Design Intern", "ledSomewhere": True, "convertedToOffer": False, "days": 200},
        {"student": "Wei Jie Tan", "employer": "BrightData", "role": "Data Intern", "ledSomewhere": False, "convertedToOffer": False, "days": 180},
    ]
    for p in placement_defs:
        placements.append({
            "id": nid("plc"),
            "universityId": uni["id"],
            "studentName": p["student"],
            "employer": p["employer"],
            "role": p["role"],
            "ledSomewhere": p["ledSomewhere"],
            "convertedToOffer": p["convertedToOffer"],
            "startedAt": _iso(p["days"]),
        })

    return {
        "users": users,
        "candidateProfiles": candidate_profiles,
        "employerProfiles": employer_profiles,
        "universityProfiles": university_profiles,
        "jobs": jobs,
        "applications": applications,
        "outcomes": outcomes,
        "placements": placements,
    }


def ensure_seeded():
    if store.is_empty():
        store.replace_all(build_seed())
        print("  Seeded demo data (UTP, employers, students, jobs, outcomes).")


def reset():
    store.replace_all(build_seed())
    print("Database reset and reseeded.")


if __name__ == "__main__":
    reset()
