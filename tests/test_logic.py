"""Unit tests for the two pieces of logic that carry the most product weight:
the explainable matcher and the readiness signal.

Run from the project root with:   python -m unittest discover tests
(uses the standard-library test runner — nothing to install).
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from matching import score_match, rank_jobs_for_candidate  # noqa: E402
from readiness import compute_readiness                     # noqa: E402

JOB = {
    "title": "Frontend Engineer",
    "location": "London, UK",
    "seniority": "junior",
    "type": "Full-time",
    "remote": False,
    "requiredSkills": ["JavaScript", "React", "TypeScript", "Git"],
}


class MatchingTests(unittest.TestCase):
    def test_strong_candidate_scores_high_with_reasons(self):
        profile = {
            "location": "London, UK", "seniority": "junior", "desiredType": "Full-time",
            "skills": ["JavaScript", "React", "TypeScript", "Git", "CSS"],
        }
        result = score_match(profile, JOB)
        self.assertGreaterEqual(result["score"], 80)
        self.assertTrue(result["reasons"])
        self.assertEqual(result["missingSkills"], [])
        self.assertEqual(result["confidence"], "high")

    def test_weak_candidate_scores_low_with_gaps(self):
        profile = {"location": "Berlin, Germany", "seniority": "senior",
                   "desiredType": "Internship", "skills": ["Photoshop"]}
        result = score_match(profile, JOB)
        self.assertLess(result["score"], 45)
        self.assertTrue(result["gaps"])

    def test_remote_neutralises_location_penalty(self):
        profile = {"location": "Anywhere", "seniority": "junior", "skills": ["React"]}
        here = score_match(profile, {**JOB, "remote": True})
        there = score_match(profile, {**JOB, "remote": False})
        self.assertGreater(here["score"], there["score"])

    def test_score_is_bounded(self):
        profile = {"location": "London, UK", "seniority": "junior",
                   "desiredType": "Full-time", "skills": JOB["requiredSkills"]}
        result = score_match(profile, JOB)
        self.assertTrue(0 <= result["score"] <= 100)

    def test_ranking_is_best_first(self):
        profile = {"location": "London, UK", "seniority": "junior", "skills": ["React", "JavaScript"]}
        jobs = [{**JOB, "requiredSkills": ["COBOL"]}, {**JOB, "requiredSkills": ["React", "JavaScript"]}]
        ranked = rank_jobs_for_candidate(profile, jobs)
        self.assertGreaterEqual(ranked[0]["score"], ranked[1]["score"])


class ReadinessTests(unittest.TestCase):
    def test_richer_profile_is_more_ready_and_bounded(self):
        bare = compute_readiness({"skills": [], "experience": [], "education": []})
        rich = compute_readiness({
            "headline": "CS student",
            "summary": "A solid two-sentence summary that comfortably passes the length check for completeness.",
            "location": "London",
            "skills": ["JS", "React", "Node", "SQL", "Git"],
            "experience": [{"title": "Software Intern", "type": "internship"}],
            "education": [{"degree": "BSc CS"}],
        })
        self.assertGreater(rich["overall"], bare["overall"])
        self.assertTrue(0 <= rich["overall"] <= 100)
        self.assertTrue(rich["nextSteps"])

    def test_four_named_dimensions(self):
        r = compute_readiness({"skills": ["JS"], "experience": [], "education": []})
        self.assertEqual(len(r["dimensions"]), 4)
        for d in r["dimensions"]:
            self.assertIsInstance(d["label"], str)
            self.assertIsInstance(d["value"], int)


if __name__ == "__main__":
    unittest.main()
