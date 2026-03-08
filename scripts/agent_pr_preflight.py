#!/usr/bin/env python3
"""CreoNow PR preflight checks (simplified).

Validates only the delivery contract below:
- Branch naming: task/<N>-<slug>
- Issue state: must be OPEN
- PR body: must contain Closes #<N>
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class CmdResult:
    code: int
    out: str


@dataclass(frozen=True)
class PullRequest:
    number: int
    body: str
    url: str


def run(cmd: list[str], *, cwd: str | None = None) -> CmdResult:
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return CmdResult(proc.returncode, proc.stdout)


def print_command_and_output(cmd: list[str], result: CmdResult) -> None:
    print(f"$ {' '.join(cmd)}")
    if result.out.strip():
        print(result.out.rstrip())


def git_root() -> str:
    cmd = ["git", "rev-parse", "--show-toplevel"]
    result = run(cmd)
    print_command_and_output(cmd, result)
    if result.code != 0:
        raise RuntimeError("[REPO] not a git repository")
    return result.out.strip()


def git_common_dir(repo_root: str) -> str:
    cmd = ["git", "rev-parse", "--git-common-dir"]
    result = run(cmd, cwd=repo_root)
    print_command_and_output(cmd, result)
    if result.code != 0:
        raise RuntimeError("[REPO] failed to get git common dir")
    return result.out.strip()


def controlplane_root(repo_root: str) -> str:
    common = git_common_dir(repo_root)
    return str((Path(repo_root) / common).resolve().parent)


def ensure_isolated_worktree(repo_root: str) -> None:
    cp_root = controlplane_root(repo_root)
    if Path(repo_root).resolve() == Path(cp_root).resolve():
        raise RuntimeError(
            f"[WORKTREE] run from an isolated task worktree, not controlplane root: {repo_root}"
        )


def current_branch(repo_root: str) -> str:
    cmd = ["git", "rev-parse", "--abbrev-ref", "HEAD"]
    result = run(cmd, cwd=repo_root)
    print_command_and_output(cmd, result)
    if result.code != 0:
        raise RuntimeError("[REPO] failed to get current branch")
    return result.out.strip()



def run_gh_json(repo: str, cmd: list[str], *, error_hint: str) -> object:
    result = run(cmd, cwd=repo)
    print_command_and_output(cmd, result)
    if result.code != 0:
        raise RuntimeError(error_hint)
    try:
        return json.loads(result.out)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{error_hint}; invalid JSON output: {exc}") from exc


def validate_issue_is_open(repo: str, issue_number: str) -> None:
    payload = run_gh_json(
        repo,
        ["gh", "issue", "view", issue_number, "--json", "number,state,title,url"],
        error_hint=f"[ISSUE] failed to query issue #{issue_number}",
    )
    state = str(payload.get("state", "")).upper()
    if state != "OPEN":
        raise RuntimeError(f"[ISSUE] issue #{issue_number} state is {state}; expected OPEN")


def query_open_pr_for_branch(repo: str, branch: str) -> PullRequest:
    payload = run_gh_json(
        repo,
        [
            "gh",
            "pr",
            "list",
            "--state",
            "open",
            "--head",
            branch,
            "--limit",
            "1",
            "--json",
            "number,body,url",
        ],
        error_hint=f"[PR] failed to query open PR for branch {branch}",
    )
    if not isinstance(payload, list) or not payload:
        raise RuntimeError(f"[PR] no open PR found for branch {branch}; create PR first")

    item = payload[0]
    number_raw = item.get("number")
    if not isinstance(number_raw, int):
        raise RuntimeError("[PR] invalid PR payload: number is missing")
    body_raw = item.get("body")
    if body_raw is None:
        body_raw = ""
    if not isinstance(body_raw, str):
        raise RuntimeError("[PR] invalid PR payload: body is not a string")
    url_raw = item.get("url")
    if not isinstance(url_raw, str) or not url_raw:
        raise RuntimeError("[PR] invalid PR payload: url is missing")
    return PullRequest(number=number_raw, body=body_raw, url=url_raw)


def validate_pr_body_format(pr: PullRequest, issue_number: str) -> None:
    pattern = re.compile(rf"(?i)\bcloses\s+#\s*{re.escape(issue_number)}\b")
    if not pattern.search(pr.body):
        raise RuntimeError(
            f"[PR] #{pr.number} body must contain `Closes #{issue_number}` (url: {pr.url})"
        )


def main() -> int:
    try:
        print("== Repo checks ==")
        repo = git_root()
        ensure_isolated_worktree(repo)
        branch = current_branch(repo)

        print("\n== Branch contract ==")
        match = re.match(r"^task/(?P<n>[0-9]+)-(?P<slug>[a-z0-9-]+)$", branch)
        if not match:
            raise RuntimeError(f"[CONTRACT] branch must be task/<N>-<slug>, got: {branch}")
        issue_number = match.group("n")
        print(f"Branch OK: {branch}")

        print("\n== Issue checks ==")
        validate_issue_is_open(repo, issue_number)
        print(f"Issue OK: #{issue_number} is OPEN")

        print("\n== PR checks ==")
        pr = query_open_pr_for_branch(repo, branch)
        validate_pr_body_format(pr, issue_number)
        print(f"PR body OK: #{pr.number} contains Closes #{issue_number}")

        print("\nOK: preflight checks passed")
        return 0
    except Exception as exc:
        print(f"PRE-FLIGHT FAILED: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
