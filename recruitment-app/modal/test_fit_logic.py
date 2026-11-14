import unittest

from fit_logic import build_fit_summary, build_summaries, validate_output


CANDIDATE = {
    "id": "cand-aino",
    "name": "Aino Vikström",
    "tags": ["Frontend", "Accessibility"],
    "facts": [
        {
            "id": "fact-a",
            "claim": "I rebuilt the returns flow and made the interface more accessible.",
            "skillTags": ["Frontend", "Accessibility"],
            "evidenceUrl": "https://example.com/?evidence=one",
        },
        {
            "id": "fact-b",
            "claim": "People who argue about the problem before the solution.",
            "skillTags": ["Teamwork"],
            "evidenceUrl": None,
        },
    ],
}

ROLE = {
    "id": "role-1",
    "title": "Product Engineer",
    "problemNow": "The consent flow is hard to read.",
    "skills": ["Frontend", "Design systems"],
    "employerName": "Northwind Labs",
}


class FitLogicTests(unittest.TestCase):
    def test_summary_is_transparent_and_advisory(self):
        summary = build_fit_summary(CANDIDATE, ROLE)
        self.assertEqual(summary["roleId"], "role-1")
        self.assertEqual(summary["candidateId"], "cand-aino")
        self.assertIn("1 of 2 claims include an evidence link", summary["digest"])
        self.assertIn("Reachability is not a truth score", summary["digest"])
        self.assertEqual(summary["evidenceCoverage"], 1)
        self.assertTrue(summary["sharedThemes"])
        self.assertTrue(all("theme" in theme for theme in summary["sharedThemes"]))
        self.assertNotIn("score", summary)

    def test_summary_works_without_evidence_or_portfolio(self):
        candidate = {
            **CANDIDATE,
            "facts": [
                {
                    "id": "fact-c",
                    "claim": "I kept a retail team through a difficult Christmas.",
                    "skillTags": ["Retail"],
                    "evidenceUrl": None,
                }
            ],
        }
        summary = build_fit_summary(candidate, {**ROLE, "skills": ["Retail"]})
        self.assertEqual(summary["evidenceCoverage"], 0)
        self.assertIn("0 of 1 claims include an evidence link", summary["digest"])

    def test_batch_output_shape_and_validation(self):
        result = build_summaries(
            {"candidates": [CANDIDATE], "roles": [ROLE, {**ROLE, "id": "role-2"}]}
        )
        self.assertEqual(result["generatedBy"], "modal")
        self.assertEqual(len(result["summaries"]), 2)
        validate_output(result)

    def test_validation_rejects_missing_fields(self):
        with self.assertRaises(ValueError):
            validate_output({"summaries": [{"roleId": "x"}]})


if __name__ == "__main__":
    unittest.main()
