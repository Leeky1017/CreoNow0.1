#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class CmdResult:
    code: int
    out: str


@dataclass(frozen=True)
class RulebookTaskLocation:
    kind: str
    path: str


def run(cmd: list[str], *, cwd: str | None = None, env: dict[str, str] | None = None) -> CmdResult:
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return CmdResult(proc.returncode, proc.stdout)


def must_run(cmd: list[str], *, cwd: str | None = None) -> None:
    res = run(cmd, cwd=cwd)
    print(f"$ {' '.join(cmd)}")
    if res.out.strip():
        print(res.out.rstrip())
    if res.code != 0:
        raise RuntimeError(f"command failed: {' '.join(cmd)} (exit {res.code})")


def git_root() -> str:
    res = run(["git", "rev-parse", "--show-toplevel"])
    if res.code != 0:
        print(res.out, file=sys.stderr)
        raise RuntimeError("not a git repository")
    return res.out.strip()


def current_branch(repo_root: str) -> str:
    res = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=repo_root)
    if res.code != 0:
        print(res.out, file=sys.stderr)
        raise RuntimeError("failed to get current branch")
    return res.out.strip()


def current_head_sha(repo_root: str) -> str:
    res = run(["git", "rev-parse", "HEAD"], cwd=repo_root)
    if res.code != 0:
        print(res.out, file=sys.stderr)
        raise RuntimeError("failed to get current HEAD sha")
    return res.out.strip()


def current_head_parent_sha(repo_root: str) -> str:
    res = run(["git", "rev-parse", "HEAD^"], cwd=repo_root)
    if res.code != 0:
        print(res.out, file=sys.stderr)
        raise RuntimeError(
            "[MAIN_AUDIT] failed to resolve HEAD^; main-session audit requires a dedicated signing commit on top of reviewed changes"
        )
    return res.out.strip()


def require_file(path: str) -> None:
    if not os.path.isfile(path):
        raise RuntimeError(f"[RUN_LOG] required file missing: {path}")


def require_rulebook_task_files(task_dir: str, *, task_id: str, kind: str) -> None:
    missing: list[str] = []
    for rel in (".metadata.json", "proposal.md", "tasks.md"):
        if not os.path.isfile(os.path.join(task_dir, rel)):
            missing.append(rel)
    if missing:
        raise RuntimeError(
            f"[RULEBOOK] {kind} task dir missing required files for {task_id}: {task_dir} ({', '.join(missing)})"
        )


def resolve_rulebook_task_location(repo: str, task_id: str) -> RulebookTaskLocation:
    active_dir = os.path.join(repo, "rulebook", "tasks", task_id)
    archive_root = os.path.join(repo, "rulebook", "tasks", "archive")

    archive_candidates: list[str] = []
    if os.path.isdir(archive_root):
        for name in sorted(os.listdir(archive_root)):
            if not name.endswith(f"-{task_id}"):
                continue
            candidate = os.path.join(archive_root, name)
            if os.path.isdir(candidate):
                archive_candidates.append(candidate)

    has_active = os.path.isdir(active_dir)
    if has_active and archive_candidates:
        raise RuntimeError(
            "[RULEBOOK] both active and archived task dirs found for current task; keep a single source of truth: "
            f"{task_id}"
        )

    if has_active:
        return RulebookTaskLocation(kind="active", path=active_dir)

    if len(archive_candidates) > 1:
        joined = ", ".join(archive_candidates)
        raise RuntimeError(
            f"[RULEBOOK] multiple archived task dirs matched {task_id}; cannot resolve uniquely: {joined}"
        )

    if len(archive_candidates) == 1:
        return RulebookTaskLocation(kind="archive", path=archive_candidates[0])

    raise RuntimeError(
        f"[RULEBOOK] required task dir missing in both active and archive for {task_id}: {active_dir}"
    )


def validate_issue_is_open(repo: str, issue_number: str) -> None:
    cmd = ["gh", "issue", "view", issue_number, "--json", "number,state,title,url"]
    res = run(cmd, cwd=repo)
    print(f"$ {' '.join(cmd)}")
    if res.out.strip():
        print(res.out.rstrip())
    if res.code != 0:
        raise RuntimeError(
            f"[ISSUE] failed to query issue #{issue_number}; cannot validate issue freshness/open state"
        )

    try:
        payload = json.loads(res.out)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"[ISSUE] invalid gh output while checking issue #{issue_number}: {exc}"
        ) from exc

    state = str(payload.get("state", "")).upper()
    if state != "OPEN":
        raise RuntimeError(
            f"[ISSUE] issue #{issue_number} state is {state}; active delivery must use an OPEN issue"
        )


def validate_runlog_pr_field(path: str) -> None:
    with open(path, "r", encoding="utf-8") as fp:
        content = fp.read()

    m = re.search(r"^- PR:\s*(.+)$", content, re.MULTILINE)
    if not m:
        raise RuntimeError(
            f"[RUN_LOG] missing PR field line ('- PR: ...') in {path}"
        )

    value = m.group(1).strip()
    if not value:
        raise RuntimeError(f"[RUN_LOG] PR field cannot be empty in {path}")
    lowered = value.lower()
    if (
        value in {"(待回填)", "(to-be-filled)", "TBD", "TODO"}
        or "待回填" in value
        or "tbd" in lowered
        or "todo" in lowered
        or "placeholder" in lowered
    ):
        raise RuntimeError(
            f"[RUN_LOG] PR field still placeholder in {path}: {value}"
        )
    if not re.match(r"^https?://", value):
        raise RuntimeError(
            f"[RUN_LOG] PR field must be a real URL in {path}: {value}"
        )
    if "/pull/" not in value:
        raise RuntimeError(
            f"[RUN_LOG] PR field must be a pull-request URL in {path}: {value}"
        )


MAIN_AUDIT_SECTION_TITLE = "## Main Session Audit"
TASK_RUN_LOG_PATH_RE = re.compile(r"^openspec/_ops/task_runs/ISSUE-\d+\.md$")
MAIN_AUDIT_REQUIRED_FIELDS: tuple[str, ...] = (
    "Audit-Owner",
    "Reviewed-HEAD-SHA",
    "Spec-Compliance",
    "Code-Quality",
    "Fresh-Verification",
    "Blocking-Issues",
    "Decision",
)


def _extract_main_audit_section(content: str, path: str) -> str:
    m = re.search(
        r"^## Main Session Audit\s*$([\s\S]*?)(?=^##\s|\Z)",
        content,
        re.MULTILINE,
    )
    if not m:
        raise RuntimeError(
            f"[MAIN_AUDIT] missing required section '{MAIN_AUDIT_SECTION_TITLE}' in {path}"
        )
    return m.group(1)


def _parse_main_audit_fields(section: str, path: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for field in MAIN_AUDIT_REQUIRED_FIELDS:
        m = re.search(rf"^- {re.escape(field)}:\s*(.+)$", section, re.MULTILINE)
        if not m:
            raise RuntimeError(
                f"[MAIN_AUDIT] missing required field '{field}' in {path}"
            )
        value = m.group(1).strip()
        if not value:
            raise RuntimeError(
                f"[MAIN_AUDIT] field '{field}' cannot be empty in {path}"
            )
        fields[field] = value
    return fields


MAIN_AUDIT_REVIEWED_SHA_PLACEHOLDERS: tuple[str, ...] = (
    "pending_sha",
    "tbd",
    "todo",
    "to-be-filled",
    "<to-be-filled by signing commit head^>",
)


def _is_main_audit_placeholder_sha(value: str) -> bool:
    normalized = value.strip().lower()
    if normalized in MAIN_AUDIT_REVIEWED_SHA_PLACEHOLDERS:
        return True
    return "pending" in normalized and "sha" in normalized


def _main_audit_resign_hint(path: str) -> str:
    issue_match = re.search(r"ISSUE-(\d+)\.md$", os.path.basename(path), re.IGNORECASE)
    issue_hint = issue_match.group(1) if issue_match else "<N>"
    return (
        "Run `scripts/main_audit_resign.sh --issue "
        f"{issue_hint} --preflight-mode fast` to backfill Reviewed-HEAD-SHA before pushing."
    )


def validate_main_session_audit(path: str, head_sha: str) -> None:
    with open(path, "r", encoding="utf-8") as fp:
        content = fp.read()

    section = _extract_main_audit_section(content, path)
    fields = _parse_main_audit_fields(section, path)

    audit_owner = fields["Audit-Owner"]
    if audit_owner != "main-session":
        raise RuntimeError(
            f"[MAIN_AUDIT] Audit-Owner must be 'main-session', got '{audit_owner}'"
        )

    reviewed_sha = fields["Reviewed-HEAD-SHA"]
    if _is_main_audit_placeholder_sha(reviewed_sha):
        raise RuntimeError(
            f"[MAIN_AUDIT] Reviewed-HEAD-SHA is still placeholder '{reviewed_sha}'. "
            + _main_audit_resign_hint(path)
        )
    if not re.match(r"^[0-9a-fA-F]{40}$", reviewed_sha):
        raise RuntimeError(
            f"[MAIN_AUDIT] Reviewed-HEAD-SHA must be a 40-hex commit sha, got '{reviewed_sha}'"
        )
    if reviewed_sha.lower() != head_sha.lower():
        raise RuntimeError(
            f"[MAIN_AUDIT] Reviewed-HEAD-SHA mismatch: audit={reviewed_sha}, head={head_sha}. "
            + _main_audit_resign_hint(path)
        )

    for field in ("Spec-Compliance", "Code-Quality", "Fresh-Verification"):
        value = fields[field]
        if value not in {"PASS", "FAIL"}:
            raise RuntimeError(
                f"[MAIN_AUDIT] {field} must be PASS or FAIL, got '{value}'"
            )
        if value != "PASS":
            raise RuntimeError(
                f"[MAIN_AUDIT] {field} must be PASS to continue, got '{value}'"
            )

    blocking_raw = fields["Blocking-Issues"]
    if not re.match(r"^\d+$", blocking_raw):
        raise RuntimeError(
            f"[MAIN_AUDIT] Blocking-Issues must be a non-negative integer, got '{blocking_raw}'"
        )
    if int(blocking_raw) != 0:
        raise RuntimeError(
            f"[MAIN_AUDIT] Blocking-Issues must be 0 to continue, got '{blocking_raw}'"
        )

    decision = fields["Decision"]
    if decision not in {"ACCEPT", "REJECT"}:
        raise RuntimeError(
            f"[MAIN_AUDIT] Decision must be ACCEPT or REJECT, got '{decision}'"
        )
    if decision != "ACCEPT":
        raise RuntimeError(
            f"[MAIN_AUDIT] Decision must be ACCEPT to continue, got '{decision}'"
        )


def validate_main_session_audit_signature_commit(repo: str, run_log_path: str) -> None:
    run_log_rel = os.path.relpath(run_log_path, repo).replace(os.sep, "/")
    res = run(
        ["git", "diff", "--name-only", "--diff-filter=ACMR", "HEAD^..HEAD"],
        cwd=repo,
    )
    if res.code != 0:
        raise RuntimeError(
            "[MAIN_AUDIT] failed to inspect signing commit diff (HEAD^..HEAD)"
        )

    changed_files = [line.strip() for line in res.out.splitlines() if line.strip()]
    if run_log_rel not in changed_files:
        raise RuntimeError(
            f"[MAIN_AUDIT] signing commit must include RUN_LOG update: {run_log_rel}"
        )

    disallowed = sorted(path for path in changed_files if path != run_log_rel)
    if disallowed:
        raise RuntimeError(
            "[MAIN_AUDIT] signing commit must only change RUN_LOG; found additional files: "
            + ", ".join(disallowed)
        )


REQUIRED_CHANGE_TASKS_HEADINGS: tuple[str, ...] = (
    "## 1. Specification",
    "## 2. TDD Mapping（先测前提）",
    "## 3. Red（先写失败测试）",
    "## 4. Green（最小实现通过）",
    "## 5. Refactor（保持绿灯）",
    "## 6. Evidence",
)
REQUIRED_DEPENDENCY_SYNC_TEXT = "依赖同步检查（Dependency Sync Check）"


def list_active_changes(repo: str) -> list[str]:
    changes_root = os.path.join(repo, "openspec", "changes")
    if not os.path.isdir(changes_root):
        return []
    active: list[str] = []
    for name in sorted(os.listdir(changes_root)):
        if name.startswith(".") or name in {"archive", "_template"}:
            continue
        abs_path = os.path.join(changes_root, name)
        if os.path.isdir(abs_path):
            active.append(name)
    return active


def parse_markdown_checkbox_states(content: str) -> list[bool]:
    states: list[bool] = []
    for mark in re.findall(r"^- \[([ xX])\]", content, flags=re.MULTILINE):
        states.append(mark.lower() == "x")
    return states


def build_archive_fix_commands(change_names: list[str]) -> list[str]:
    return [
        f"mv openspec/changes/{change_name} openspec/changes/archive/{change_name}"
        for change_name in sorted(change_names)
    ]


def validate_no_completed_active_changes(repo: str) -> None:
    active_changes = list_active_changes(repo)
    if not active_changes:
        print("(skip) active change archive check: no active changes")
        return

    completed_active: list[str] = []
    for change_name in active_changes:
        tasks_path = os.path.join(repo, "openspec", "changes", change_name, "tasks.md")
        if not os.path.isfile(tasks_path):
            continue

        with open(tasks_path, "r", encoding="utf-8") as fp:
            content = fp.read()

        checkbox_states = parse_markdown_checkbox_states(content)
        if checkbox_states and all(checkbox_states):
            completed_active.append(change_name)

    if completed_active:
        joined = ", ".join(sorted(completed_active))
        fix_commands = build_archive_fix_commands(completed_active)
        rerun_hint = "scripts/agent_pr_preflight.sh --mode fast"
        raise RuntimeError(
            "[OPENSPEC_CHANGE] change tasks.md checkboxes are all checked, so the change is completed "
            "and must be archived from openspec/changes/ to openspec/changes/archive/: "
            f"{joined}. Fix (copy & run): {' ; '.join(fix_commands)}. Then rerun: {rerun_hint}"
        )


def validate_tdd_first_change_tasks(repo: str, changed_files: set[str]) -> None:
    targets = sorted(
        path
        for path in changed_files
        if re.match(r"^openspec/changes/[^/]+/tasks\.md$", path) and not path.startswith("openspec/changes/archive/")
    )
    if not targets:
        print("(skip) openspec change tasks TDD-structure check: no changed openspec/changes/*/tasks.md")
        return

    for rel_path in targets:
        abs_path = os.path.join(repo, rel_path)
        if not os.path.isfile(abs_path):
            raise RuntimeError(f"[OPENSPEC_CHANGE] missing tasks file: {rel_path}")

        with open(abs_path, "r", encoding="utf-8") as fp:
            content = fp.read()

        cursor = -1
        for heading in REQUIRED_CHANGE_TASKS_HEADINGS:
            idx = content.find(heading)
            if idx < 0:
                raise RuntimeError(
                    f"[OPENSPEC_CHANGE] {rel_path} missing required heading: {heading}"
                )
            if idx <= cursor:
                raise RuntimeError(
                    f"[OPENSPEC_CHANGE] {rel_path} headings out of order: {heading}"
                )
            cursor = idx

        if "未出现 Red（失败测试）不得进入实现" not in content:
            raise RuntimeError(
                f"[OPENSPEC_CHANGE] {rel_path} must contain Red-gate text: 未出现 Red（失败测试）不得进入实现"
            )

        if "Scenario" not in content or "映射" not in content:
            raise RuntimeError(
                f"[OPENSPEC_CHANGE] {rel_path} must include Scenario->测试映射要求 in TDD Mapping section"
            )
        if REQUIRED_DEPENDENCY_SYNC_TEXT not in content:
            raise RuntimeError(
                f"[OPENSPEC_CHANGE] {rel_path} must contain dependency-sync text: {REQUIRED_DEPENDENCY_SYNC_TEXT}"
            )


def validate_execution_order_doc(repo: str, changed_files: set[str]) -> None:
    active_changes = list_active_changes(repo)
    if len(active_changes) < 2:
        print("(skip) execution order check: active changes < 2")
        return

    order_doc_rel = "openspec/changes/EXECUTION_ORDER.md"
    order_doc_abs = os.path.join(repo, order_doc_rel)
    if not os.path.isfile(order_doc_abs):
        raise RuntimeError(
            "[OPENSPEC_CHANGE] multiple active changes detected; missing openspec/changes/EXECUTION_ORDER.md"
        )

    with open(order_doc_abs, "r", encoding="utf-8") as fp:
        content = fp.read()

    for marker in ("更新时间", "## 执行策略", "## 执行顺序", "## 依赖说明"):
        if marker not in content:
            raise RuntimeError(
                f"[OPENSPEC_CHANGE] {order_doc_rel} missing required section/field: {marker}"
            )

    updated_at = re.search(r"^更新时间：(\d{4}-\d{2}-\d{2} \d{2}:\d{2})$", content, re.MULTILINE)
    if not updated_at:
        raise RuntimeError(
            f"[OPENSPEC_CHANGE] {order_doc_rel} 更新时间格式必须为 YYYY-MM-DD HH:mm"
        )

    for change_name in active_changes:
        if change_name not in content:
            raise RuntimeError(
                f"[OPENSPEC_CHANGE] {order_doc_rel} must include active change: {change_name}"
            )

    active_change_touched = any(
        any(path.startswith(f"openspec/changes/{change_name}/") for change_name in active_changes)
        for path in changed_files
    )
    if active_change_touched and order_doc_rel not in changed_files:
        raise RuntimeError(
            "[OPENSPEC_CHANGE] active change content updated but openspec/changes/EXECUTION_ORDER.md not updated in this PR"
        )


def collect_changed_files(repo: str) -> set[str]:
    changed_files: set[str] = set()
    for cmd in [
        ["git", "diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"],
        ["git", "diff", "--name-only", "--diff-filter=ACMR"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ]:
        res = run(cmd, cwd=repo)
        if res.code != 0:
            print(res.out, file=sys.stderr)
            raise RuntimeError(f"failed to list changed files: {' '.join(cmd)}")
        for line in res.out.splitlines():
            if line.strip():
                changed_files.add(line.strip())
    return changed_files


def collect_branch_commits(repo: str) -> list[str]:
    res = run(["git", "rev-list", "--reverse", "origin/main..HEAD"], cwd=repo)
    if res.code != 0:
        raise RuntimeError("[GOV_EVIDENCE] failed to list branch commits (origin/main..HEAD)")
    return [line.strip() for line in res.out.splitlines() if line.strip()]


def collect_commit_changed_files(repo: str, sha: str) -> set[str]:
    res = run(["git", "show", "--name-only", "--pretty=format:", sha], cwd=repo)
    if res.code != 0:
        raise RuntimeError(f"[GOV_EVIDENCE] failed to inspect commit files: {sha}")
    return {line.strip() for line in res.out.splitlines() if line.strip()}


def _is_progress_artifact_path(path: str, *, issue_number: str, task_id: str, slug: str) -> bool:
    run_log_rel = f"openspec/_ops/task_runs/ISSUE-{issue_number}.md"
    review_rel = f"openspec/_ops/reviews/ISSUE-{issue_number}.md"
    if path in {run_log_rel, review_rel}:
        return True

    if path.startswith(f"rulebook/tasks/{task_id}/"):
        return True
    if re.match(rf"^rulebook/tasks/archive/[^/]+-{re.escape(task_id)}/", path):
        return True

    if slug:
        if path.startswith(f"openspec/changes/{slug}/"):
            return True
        if path.startswith(f"openspec/changes/archive/{slug}/"):
            return True

    return False


def validate_progress_evidence_timeline(repo: str, *, issue_number: str, task_id: str, slug: str) -> None:
    commits = collect_branch_commits(repo)
    if len(commits) <= 1:
        print("(skip) progressive evidence check: <= 1 commit in branch range")
        return

    progress_indexes: list[int] = []
    has_non_progress_before_head = False

    for idx, sha in enumerate(commits):
        changed = collect_commit_changed_files(repo, sha)
        if not changed:
            continue

        has_progress = any(
            _is_progress_artifact_path(path, issue_number=issue_number, task_id=task_id, slug=slug)
            for path in changed
        )
        has_non_progress = any(
            not _is_progress_artifact_path(path, issue_number=issue_number, task_id=task_id, slug=slug)
            for path in changed
        )

        if has_progress:
            progress_indexes.append(idx)
        if idx < len(commits) - 1 and has_non_progress:
            has_non_progress_before_head = True

    if not progress_indexes:
        raise RuntimeError(
            "[GOV_EVIDENCE] branch has no progress artifacts for current issue "
            f"(RUN_LOG/review/rulebook/change-task): issue #{issue_number}"
        )

    if has_non_progress_before_head:
        has_progress_before_signing_tail = any(idx < len(commits) - 2 for idx in progress_indexes)
        if not has_progress_before_signing_tail:
            raise RuntimeError(
                "[GOV_EVIDENCE] progress artifacts were only introduced in the final signing tail commits "
                "(typically review/signoff). This indicates end-backfill. Update Rulebook/RUN_LOG/OpenSpec task "
                "during execution, then re-sign main-session audit."
            )

    print(
        "OK: progressive evidence timeline check passed "
        f"(commits={len(commits)}, progress_commits={len(progress_indexes)})"
    )


def collect_staged_files(repo: str) -> set[str]:
    res = run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        cwd=repo,
    )
    if res.code != 0:
        print(res.out, file=sys.stderr)
        raise RuntimeError("failed to list staged files: git diff --cached --name-only --diff-filter=ACMR")

    staged: set[str] = set()
    for line in res.out.splitlines():
        rel_path = line.strip()
        if rel_path:
            staged.add(rel_path)
    return staged


def validate_staged_run_logs_main_audit_section(repo: str, staged_files: set[str]) -> None:
    targets = sorted(path for path in staged_files if TASK_RUN_LOG_PATH_RE.match(path))
    if not targets:
        print("(skip) staged RUN_LOG main-audit-section check: no staged openspec/_ops/task_runs/ISSUE-*.md")
        return

    for rel_path in targets:
        abs_path = os.path.join(repo, rel_path)
        if not os.path.isfile(abs_path):
            continue
        with open(abs_path, "r", encoding="utf-8") as fp:
            content = fp.read()
        _extract_main_audit_section(content, rel_path)

    print(f"OK: validated Main Session Audit section for {len(targets)} staged RUN_LOG file(s)")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="CreoNow governed preflight checks"
    )
    parser.add_argument(
        "--mode",
        choices=("commit", "fast", "full"),
        default="full",
        help="commit: staged-file local commit guard; fast: governance/signoff checks only; full: include lint/type/tests (default).",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    issue_number = "unknown"
    try:
        repo = git_root()
        if args.mode == "commit":
            branch = current_branch(repo)
            if not re.match(r"^task/[0-9]+-[a-z0-9-]+$", branch):
                print(
                    f"(skip) commit preflight: branch is not task/<N>-<slug> ({branch})",
                )
                return 0

            staged_files = collect_staged_files(repo)
            if not staged_files:
                print("(skip) commit preflight: no staged files")
                return 0

            print("== Preflight mode: commit ==")
            must_run(
                ["python3", "scripts/check_doc_timestamps.py", "--files", *sorted(staged_files)],
                cwd=repo,
            )
            validate_staged_run_logs_main_audit_section(repo, staged_files)
            print("\nOK: commit preflight checks passed")
            return 0

        branch = current_branch(repo)
        m = re.match(r"^task/(?P<n>[0-9]+)-(?P<slug>[a-z0-9-]+)$", branch)
        if not m:
            raise RuntimeError(f"[CONTRACT] branch must be task/<N>-<slug>, got: {branch}")

        issue_number = m.group("n")
        slug = m.group("slug")
        head_parent_sha = current_head_parent_sha(repo)
        run_log = os.path.join(repo, "openspec", "_ops", "task_runs", f"ISSUE-{issue_number}.md")
        require_file(run_log)
        validate_runlog_pr_field(run_log)
        validate_main_session_audit(run_log, head_parent_sha)
        validate_main_session_audit_signature_commit(repo, run_log)

        print(f"== Preflight mode: {args.mode} ==")
        print("== Repo checks ==")
        must_run(["git", "status", "--porcelain=v1"], cwd=repo)

        print("\n== Issue checks ==")
        validate_issue_is_open(repo, issue_number)

        print("\n== Rulebook checks ==")
        task_id = f"issue-{issue_number}-{slug}"
        task_location = resolve_rulebook_task_location(repo, task_id)
        require_rulebook_task_files(task_location.path, task_id=task_id, kind=task_location.kind)
        if task_location.kind == "active":
            must_run(["rulebook", "task", "validate", task_id], cwd=repo)
        else:
            print(f"(skip) rulebook task validate: current task is archived at {task_location.path}")

        validate_progress_evidence_timeline(
            repo,
            issue_number=issue_number,
            task_id=task_id,
            slug=slug,
        )

        print("\n== Workspace checks ==")
        # Keep preflight OS-agnostic; Windows-only build/E2E are enforced in CI.
        #
        # Formatting policy:
        # - We only enforce Prettier on files changed in this branch, to avoid
        #   blocking delivery on legacy/unrelated formatting drift.
        changed_files = collect_changed_files(repo)

        must_run(["python3", "scripts/check_doc_timestamps.py"], cwd=repo)

        print("\n== OpenSpec change checks ==")
        validate_no_completed_active_changes(repo)
        validate_tdd_first_change_tasks(repo, changed_files)
        validate_execution_order_doc(repo, changed_files)

        if args.mode == "fast":
            print("\nOK: fast preflight checks passed")
            return 0

        prettier_exts = (
            ".cjs",
            ".css",
            ".html",
            ".js",
            ".json",
            ".md",
            ".mjs",
            ".ts",
            ".tsx",
            ".yaml",
            ".yml",
        )
        prettier_targets = sorted([p for p in changed_files if p.endswith(prettier_exts)])
        if prettier_targets:
            must_run(["pnpm", "exec", "prettier", "--check", *prettier_targets], cwd=repo)
        else:
            print("(skip) prettier --check: no changed targets")

        must_run(["pnpm", "typecheck"], cwd=repo)
        must_run(["pnpm", "lint"], cwd=repo)
        must_run(["pnpm", "contract:check"], cwd=repo)
        must_run(["pnpm", "cross-module:check"], cwd=repo)
        must_run(["pnpm", "test:unit"], cwd=repo)

        return 0
    except Exception as e:
        message = str(e)
        print(f"PRE-FLIGHT FAILED: {message}", file=sys.stderr)
        if "[MAIN_AUDIT] Reviewed-HEAD-SHA" in message and issue_number.isdigit():
            print(
                f"HINT: run `scripts/main_audit_resign.sh --issue {issue_number} --preflight-mode fast` then `scripts/agent_pr_preflight.sh --mode fast`.",
                file=sys.stderr,
            )
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
