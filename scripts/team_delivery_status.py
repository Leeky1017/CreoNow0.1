#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from typing import Any


REQUIRED_CHECKS = ("ci", "openspec-log-guard", "merge-serial")


@dataclass(frozen=True)
class CmdResult:
    code: int
    out: str


def run(cmd: list[str], *, cwd: str | None = None) -> CmdResult:
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return CmdResult(code=proc.returncode, out=proc.stdout)


def git_root() -> str:
    res = run(["git", "rev-parse", "--show-toplevel"])
    if res.code != 0:
        raise RuntimeError("not a git repository")
    return res.out.strip()


def current_branch(repo: str) -> str:
    res = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=repo)
    if res.code != 0:
        raise RuntimeError("failed to get current branch")
    return res.out.strip()


def detect_issue_number(repo: str, explicit: str | None) -> str | None:
    if explicit:
        return explicit
    branch = current_branch(repo)
    m = re.match(r"^task/(?P<n>[0-9]+)-", branch)
    if not m:
        return None
    return m.group("n")


def parse_run_log_audit(repo: str, issue_number: str | None) -> dict[str, Any]:
    if not issue_number:
        return {"available": False, "reason": "issue number unavailable"}

    run_log = os.path.join(repo, "openspec", "_ops", "task_runs", f"ISSUE-{issue_number}.md")
    if not os.path.isfile(run_log):
        return {"available": False, "reason": f"run log missing: {run_log}"}

    with open(run_log, "r", encoding="utf-8") as fp:
        content = fp.read()

    reviewed_match = re.search(r"(?m)^- Reviewed-HEAD-SHA:\s*([0-9a-fA-F]{40})\s*$", content)
    if not reviewed_match:
        return {"available": False, "reason": "Reviewed-HEAD-SHA not found"}
    reviewed_sha = reviewed_match.group(1).lower()

    head_parent_res = run(["git", "rev-parse", "HEAD^"], cwd=repo)
    if head_parent_res.code != 0:
        return {"available": False, "reason": "failed to resolve HEAD^"}
    expected_sha = head_parent_res.out.strip().lower()

    return {
        "available": True,
        "run_log": os.path.relpath(run_log, repo),
        "reviewed_head_sha": reviewed_sha,
        "expected_head_parent_sha": expected_sha,
        "match": reviewed_sha == expected_sha,
    }


def parse_check_state(entry: dict[str, Any]) -> tuple[str, str]:
    name = str(entry.get("name") or entry.get("context") or "").strip()
    status = str(entry.get("status") or "").strip().upper()
    conclusion = str(entry.get("conclusion") or "").strip().upper()
    state_field = str(entry.get("state") or "").strip().upper()
    state = conclusion or state_field or status or "UNKNOWN"
    return name, state


def normalize_check_state(state: str) -> str:
    normalized = state.upper()
    if normalized in {"SUCCESS", "SKIPPED", "NEUTRAL"}:
        return "success"
    if normalized in {"PENDING", "QUEUED", "IN_PROGRESS", "EXPECTED", "WAITING"}:
        return "pending"
    if normalized in {"FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED"}:
        return "failed"
    return "unknown"


def fetch_pr_status(repo: str, pr_number: str | None) -> dict[str, Any]:
    if not pr_number:
        return {"available": False, "reason": "pr number unavailable"}

    cmd = [
        "gh",
        "pr",
        "view",
        pr_number,
        "--json",
        "state,mergeStateStatus,autoMergeRequest,url,statusCheckRollup",
    ]
    res = run(cmd, cwd=repo)
    if res.code != 0:
        return {"available": False, "reason": res.out.strip()}

    payload = json.loads(res.out)
    checks: dict[str, str] = {}
    for item in payload.get("statusCheckRollup") or []:
        if not isinstance(item, dict):
            continue
        name, raw_state = parse_check_state(item)
        if not name:
            continue
        checks[name] = normalize_check_state(raw_state)

    required: dict[str, str] = {}
    for required_name in REQUIRED_CHECKS:
        required[required_name] = checks.get(required_name, "pending")

    return {
        "available": True,
        "url": payload.get("url"),
        "state": payload.get("state"),
        "merge_state_status": payload.get("mergeStateStatus"),
        "auto_merge_enabled": payload.get("autoMergeRequest") is not None,
        "required_checks": required,
    }


def fetch_team_doctor(repo: str, team_id: str | None) -> dict[str, Any]:
    if not team_id:
        return {"available": False, "reason": "team_id unavailable"}

    cmd = ["codex", "team", "doctor", team_id, "--json"]
    res = run(cmd, cwd=repo)
    if res.code != 0:
        return {"available": False, "reason": res.out.strip()}
    payload = json.loads(res.out)
    return {
        "available": True,
        "status": payload.get("status", "unknown"),
        "pending_ack_messages": payload.get("pending_ack_messages", 0),
        "stale_members": payload.get("stale_members", []),
        "dead_members": payload.get("dead_members", []),
        "stuck_tasks": payload.get("stuck_tasks", []),
        "capability_blocked_tasks": payload.get("capability_blocked_tasks", []),
    }


def evaluate_merge_readiness(
    team: dict[str, Any], pr: dict[str, Any], audit: dict[str, Any]
) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if team.get("available") and team.get("status") == "unhealthy":
        reasons.append("team unhealthy")

    if pr.get("available"):
        for check_name, state in (pr.get("required_checks") or {}).items():
            if state != "success":
                reasons.append(f"required check `{check_name}` is {state}")
        merge_state = str(pr.get("merge_state_status") or "")
        if merge_state in {"BEHIND", "DIRTY"}:
            reasons.append(f"mergeStateStatus={merge_state}")
    else:
        reasons.append("pr status unavailable")

    if audit.get("available"):
        if not audit.get("match"):
            reasons.append("Reviewed-HEAD-SHA mismatch")
    else:
        reasons.append("main session audit unavailable")

    return len(reasons) == 0, reasons


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Aggregate Team/GitHub/Governance delivery status."
    )
    parser.add_argument("--team-id", default=None, help="Target team id.")
    parser.add_argument("--pr", default=None, help="Pull request number.")
    parser.add_argument("--issue", default=None, help="Issue number for RUN_LOG audit check.")
    parser.add_argument("--json", action="store_true", help="Output JSON.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    repo = git_root()
    issue_number = detect_issue_number(repo, args.issue)

    team = fetch_team_doctor(repo, args.team_id)
    pr = fetch_pr_status(repo, args.pr)
    audit = parse_run_log_audit(repo, issue_number)
    merge_ready, reasons = evaluate_merge_readiness(team, pr, audit)

    payload = {
        "merge_ready": merge_ready,
        "blocked_reasons": reasons,
        "team": team,
        "github": pr,
        "governance": audit,
    }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    print(f"merge_ready: {'yes' if merge_ready else 'no'}")
    if reasons:
        print("blocked_reasons:")
        for reason in reasons:
            print(f"- {reason}")
    else:
        print("blocked_reasons: none")

    print("\n[Team]")
    if team.get("available"):
        print(f"status: {team.get('status')}")
        print(f"pending_ack_messages: {team.get('pending_ack_messages')}")
        print(f"stale_members: {', '.join(team.get('stale_members', [])) or '-'}")
        print(f"dead_members: {', '.join(team.get('dead_members', [])) or '-'}")
        print(f"stuck_tasks: {', '.join(team.get('stuck_tasks', [])) or '-'}")
        print(
            "capability_blocked_tasks: "
            + (", ".join(team.get("capability_blocked_tasks", [])) or "-")
        )
    else:
        print(f"unavailable: {team.get('reason')}")

    print("\n[GitHub]")
    if pr.get("available"):
        print(f"url: {pr.get('url')}")
        print(f"state: {pr.get('state')}")
        print(f"mergeStateStatus: {pr.get('merge_state_status')}")
        print(f"auto_merge_enabled: {pr.get('auto_merge_enabled')}")
        print("required_checks:")
        for check_name, state in (pr.get("required_checks") or {}).items():
            print(f"- {check_name}: {state}")
    else:
        print(f"unavailable: {pr.get('reason')}")

    print("\n[Governance]")
    if audit.get("available"):
        print(f"run_log: {audit.get('run_log')}")
        print(f"reviewed_head_sha: {audit.get('reviewed_head_sha')}")
        print(f"expected_head_parent_sha: {audit.get('expected_head_parent_sha')}")
        print(f"match: {audit.get('match')}")
    else:
        print(f"unavailable: {audit.get('reason')}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
