#!/usr/bin/env python3
from __future__ import annotations

import os
import re
import sys

import agent_pr_preflight as preflight


REQUIRED_FIELDS: tuple[str, ...] = (
    "Issue",
    "Author-Agent",
    "Reviewer-Agent",
    "Reviewed-HEAD-SHA",
    "Decision",
)


def extract_field(content: str, field: str, path: str) -> str:
    match = re.search(rf"^- {re.escape(field)}:\s*(.+)$", content, re.MULTILINE)
    if not match:
        raise RuntimeError(f"[INDEPENDENT_REVIEW] missing field '{field}' in {path}")
    value = match.group(1).strip()
    if not value:
        raise RuntimeError(f"[INDEPENDENT_REVIEW] empty field '{field}' in {path}")
    return value


def derive_issue_number(run_log_rel: str) -> str:
    match = re.search(r"ISSUE-(\d+)\.md$", run_log_rel)
    if not match:
        raise RuntimeError(
            "[INDEPENDENT_REVIEW] cannot derive issue number from run log path: "
            f"{run_log_rel}"
        )
    return match.group(1)


def normalize_issue_value(value: str) -> str:
    cleaned = value.strip()
    if cleaned.startswith("#"):
        cleaned = cleaned[1:]
    return cleaned


def current_head_grandparent_sha(repo_root: str) -> str:
    res = preflight.run(["git", "rev-parse", "HEAD^^"], cwd=repo_root)
    if res.code != 0:
        raise RuntimeError(
            "[INDEPENDENT_REVIEW] failed to resolve HEAD^^; independent review expects canonical sequence "
            "(reviewed code commit -> review record commit -> main-session signing commit)"
        )
    return res.out.strip()


def main() -> int:
    if len(sys.argv) != 2:
        print(
            "Usage: python3 scripts/validate_independent_review_ci.py <run-log-path>",
            file=sys.stderr,
        )
        return 2

    run_log_rel = sys.argv[1]
    issue_number = derive_issue_number(run_log_rel)
    review_rel = f"openspec/_ops/reviews/ISSUE-{issue_number}.md"

    repo = preflight.git_root()
    run_log_abs = os.path.join(repo, run_log_rel)
    review_abs = os.path.join(repo, review_rel)

    preflight.require_file(run_log_abs)
    preflight.require_file(review_abs)

    with open(review_abs, "r", encoding="utf-8") as fp:
        content = fp.read()

    fields = {field: extract_field(content, field, review_rel) for field in REQUIRED_FIELDS}

    issue_value = normalize_issue_value(fields["Issue"])
    if issue_value != issue_number:
        raise RuntimeError(
            f"[INDEPENDENT_REVIEW] Issue mismatch in {review_rel}: expected #{issue_number}, got {fields['Issue']}"
        )

    author_agent = fields["Author-Agent"].strip().lower()
    reviewer_agent = fields["Reviewer-Agent"].strip().lower()
    if author_agent == reviewer_agent:
        raise RuntimeError(
            f"[INDEPENDENT_REVIEW] Author-Agent and Reviewer-Agent must differ in {review_rel}"
        )

    decision = fields["Decision"].strip().upper()
    if decision != "PASS":
        raise RuntimeError(
            f"[INDEPENDENT_REVIEW] Decision must be PASS in {review_rel}, got {fields['Decision']}"
        )

    reviewed_sha = fields["Reviewed-HEAD-SHA"].strip()
    if not re.match(r"^[0-9a-fA-F]{40}$", reviewed_sha):
        raise RuntimeError(
            f"[INDEPENDENT_REVIEW] Reviewed-HEAD-SHA must be 40-hex in {review_rel}, got {reviewed_sha}"
        )

    expected_reviewed_sha = current_head_grandparent_sha(repo)
    if reviewed_sha.lower() != expected_reviewed_sha.lower():
        raise RuntimeError(
            "[INDEPENDENT_REVIEW] Reviewed-HEAD-SHA mismatch: "
            f"review={reviewed_sha}, expected={expected_reviewed_sha} (HEAD^^)"
        )

    print(f"✅ Independent review validated: {review_rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
