"""Pure, deterministic fit-brief logic for the optional Modal batch.

The batch only restates existing synthetic facts. It does not invent claims,
scores, hires, rejects, or rank people. Kept dependency-free so it can be tested
with the standard library before any Modal account or token exists.
"""

from __future__ import annotations

import re
from typing import Any


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9+ ]", " ", value.lower()).strip()


def first_name(name: str) -> str:
    return (name.split() or [name])[0]


def build_fit_summary(candidate: dict[str, Any], role: dict[str, Any]) -> dict[str, Any]:
    facts = candidate.get("facts", [])
    themes: list[dict[str, Any]] = []
    seen: set[str] = set()

    for skill in role.get("skills", []):
        needle = normalize(skill)
        if not needle:
            continue
        matches = []
        for fact in facts:
            tags = [normalize(tag) for tag in fact.get("skillTags", [])]
            if needle in tags or needle in normalize(fact.get("claim", "")):
                matches.append(fact.get("id", fact.get("claim", "")[:24]))
        if matches and needle not in seen:
            seen.add(needle)
            themes.append({"theme": skill, "factIds": matches})

    for tag in candidate.get("tags", []):
        if len(themes) >= 3:
            break
        needle = normalize(tag)
        if any(normalize(skill) == needle for skill in role.get("skills", [])) and needle not in seen:
            seen.add(needle)
            themes.append({"theme": tag, "factIds": []})

    linked = sum(1 for fact in facts if fact.get("evidenceUrl"))
    labels = [theme["theme"] for theme in themes[:3]]
    if labels:
        theme_sentence = "Shared themes in the record: " + ", ".join(labels) + "."
    else:
        theme_sentence = (
            "No direct skill overlaps found in the record; use the facts below as conversation starters."
        )
    digest = (
        first_name(candidate.get("name", "Candidate"))
        + " has "
        + str(len(facts))
        + " master-record "
        + ("item" if len(facts) == 1 else "items")
        + ". "
        + theme_sentence
        + " "
        + str(linked)
        + " of "
        + str(len(facts))
        + " claims include an evidence link. Reachability is not a truth score."
    )

    top_skill = (role.get("skills") or [role.get("title", "the role")])[0]
    questions = [
        "Ask " + first_name(candidate.get("name", "the candidate")) + " to walk through a concrete example of " + top_skill + ".",
        "How would " + first_name(candidate.get("name", "the candidate")) + " approach the live problem: " + role.get("problemNow", "") + "?",
        "What would " + first_name(candidate.get("name", "the candidate")) + " want to learn in the first 30 days with " + role.get("employerName", "the team") + "?",
    ]

    return {
        "roleId": role.get("id"),
        "candidateId": candidate.get("id"),
        "digest": digest,
        "sharedThemes": themes[:3],
        "questions": questions,
        "evidenceCoverage": linked,
    }


def build_summaries(dataset: dict[str, Any]) -> dict[str, Any]:
    summaries = []
    for candidate in dataset.get("candidates", []):
        for role in dataset.get("roles", []):
            summaries.append(build_fit_summary(candidate, role))
    return {
        "schemaVersion": 1,
        "generatedBy": "modal",
        "summaries": summaries,
    }


def validate_output(payload: dict[str, Any]) -> None:
    summaries = payload.get("summaries")
    if not isinstance(summaries, list) or not summaries:
        raise ValueError("Batch output has no summaries.")
    for summary in summaries:
        for key in ("roleId", "candidateId", "digest", "sharedThemes", "questions", "evidenceCoverage"):
            if key not in summary:
                raise ValueError("Batch output is missing " + key)
        if not isinstance(summary["evidenceCoverage"], int) or summary["evidenceCoverage"] < 0:
            raise ValueError("evidenceCoverage must be a non-negative integer")
        for theme in summary["sharedThemes"]:
            if not isinstance(theme.get("factIds"), list):
                raise ValueError("Each theme needs a factIds list")
