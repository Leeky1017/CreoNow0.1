#!/usr/bin/env python3
"""Helpers for agent GitHub delivery control-plane selection and templates."""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
from dataclasses import asdict, dataclass
from typing import Callable, Mapping, Sequence


@dataclass(frozen=True)
class CmdResult:
    code: int
    out: str


@dataclass(frozen=True)
class DeliveryCapabilities:
    override: str
    gh_installed: bool
    gh_authenticated: bool
    mcp_available: bool
    mcp_write_capable: bool
    selected_channel: str
    blocker: str | None
    reason: str


TRUTHY = {"1", "true", "yes", "on"}
DEFAULT_VERIFICATION_COMMANDS = (
    "pnpm typecheck",
    "pnpm lint",
    "pnpm test:unit",
)


AUDIT_PASS_COMMENT_PATTERN = re.compile(r"FINAL-VERDICT[\s\S]*?\bACCEPT\b", re.IGNORECASE)


def run(cmd: Sequence[str], *, cwd: str | None = None) -> CmdResult:
    proc = subprocess.run(
        list(cmd),
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return CmdResult(code=proc.returncode, out=proc.stdout)


def parse_env_bool(env: Mapping[str, str], key: str) -> bool:
    value = env.get(key, "")
    return value.strip().lower() in TRUTHY


def detect_gh_installed(which: Callable[[str], str | None] = shutil.which) -> bool:
    return which("gh") is not None


def detect_gh_authenticated(
    *,
    repo_root: str | None = None,
    run_command: Callable[[Sequence[str]], CmdResult] | None = None,
) -> bool:
    if run_command is None:
        def _run(cmd: Sequence[str]) -> CmdResult:
            return run(cmd, cwd=repo_root)
        run_command = _run
    result = run_command(("gh", "auth", "status"))
    return result.code == 0


def select_channel(
    *,
    override: str,
    gh_installed: bool,
    gh_authenticated: bool,
    mcp_available: bool,
    mcp_write_capable: bool,
) -> DeliveryCapabilities:
    normalized_override = override.lower()

    if normalized_override == "gh":
        if not gh_installed:
            return DeliveryCapabilities(
                override=normalized_override,
                gh_installed=gh_installed,
                gh_authenticated=gh_authenticated,
                mcp_available=mcp_available,
                mcp_write_capable=mcp_write_capable,
                selected_channel="none",
                blocker="missing_tool",
                reason="`gh` 未安装，无法按强制 gh 通道执行。",
            )
        if not gh_authenticated:
            return DeliveryCapabilities(
                override=normalized_override,
                gh_installed=gh_installed,
                gh_authenticated=gh_authenticated,
                mcp_available=mcp_available,
                mcp_write_capable=mcp_write_capable,
                selected_channel="none",
                blocker="missing_auth",
                reason="`gh` 已安装但未认证，无法按强制 gh 通道执行。",
            )
        return DeliveryCapabilities(
            override=normalized_override,
            gh_installed=gh_installed,
            gh_authenticated=gh_authenticated,
            mcp_available=mcp_available,
            mcp_write_capable=mcp_write_capable,
            selected_channel="gh",
            blocker=None,
            reason="`gh` 已安装且已认证。",
        )

    if normalized_override == "mcp":
        if not mcp_available:
            return DeliveryCapabilities(
                override=normalized_override,
                gh_installed=gh_installed,
                gh_authenticated=gh_authenticated,
                mcp_available=mcp_available,
                mcp_write_capable=mcp_write_capable,
                selected_channel="none",
                blocker="missing_tool",
                reason="当前会话未暴露 GitHub MCP 能力。",
            )
        if not mcp_write_capable:
            return DeliveryCapabilities(
                override=normalized_override,
                gh_installed=gh_installed,
                gh_authenticated=gh_authenticated,
                mcp_available=mcp_available,
                mcp_write_capable=mcp_write_capable,
                selected_channel="none",
                blocker="missing_permission",
                reason="GitHub MCP 可见但不具备写权限。",
            )
        return DeliveryCapabilities(
            override=normalized_override,
            gh_installed=gh_installed,
            gh_authenticated=gh_authenticated,
            mcp_available=mcp_available,
            mcp_write_capable=mcp_write_capable,
            selected_channel="mcp",
            blocker=None,
            reason="按要求强制使用 GitHub MCP 通道。",
        )

    if normalized_override == "none":
        return DeliveryCapabilities(
            override=normalized_override,
            gh_installed=gh_installed,
            gh_authenticated=gh_authenticated,
            mcp_available=mcp_available,
            mcp_write_capable=mcp_write_capable,
            selected_channel="none",
            blocker="missing_tool",
            reason="显式关闭 GitHub 交付通道。",
        )

    if gh_installed and gh_authenticated:
        return DeliveryCapabilities(
            override="auto",
            gh_installed=gh_installed,
            gh_authenticated=gh_authenticated,
            mcp_available=mcp_available,
            mcp_write_capable=mcp_write_capable,
            selected_channel="gh",
            blocker=None,
            reason="auto 模式下优先选择已就绪的 `gh`。",
        )

    if mcp_available and mcp_write_capable:
        fallback_reason = "auto 模式下 `gh` 不可用，回退到 GitHub MCP。"
        if gh_installed and not gh_authenticated:
            fallback_reason = "auto 模式下 `gh` 未认证，回退到 GitHub MCP。"
        return DeliveryCapabilities(
            override="auto",
            gh_installed=gh_installed,
            gh_authenticated=gh_authenticated,
            mcp_available=mcp_available,
            mcp_write_capable=mcp_write_capable,
            selected_channel="mcp",
            blocker=None,
            reason=fallback_reason,
        )

    blocker = "missing_tool"
    reason = "`gh` 未安装，且无 GitHub MCP 写通道。"
    if gh_installed and not gh_authenticated:
        blocker = "missing_auth"
        reason = "`gh` 已安装但未认证，且无 GitHub MCP 写通道。"
    elif mcp_available and not mcp_write_capable:
        blocker = "missing_permission"
        reason = "GitHub MCP 可见但不具备写权限，同时 `gh` 不可用。"

    return DeliveryCapabilities(
        override="auto",
        gh_installed=gh_installed,
        gh_authenticated=gh_authenticated,
        mcp_available=mcp_available,
        mcp_write_capable=mcp_write_capable,
        selected_channel="none",
        blocker=blocker,
        reason=reason,
    )


def build_pr_title(title: str, issue_number: str) -> str:
    suffix = f"(#{issue_number})"
    stripped = title.strip()
    if suffix in stripped:
        return stripped
    return f"{stripped} {suffix}".strip()


def build_pr_body(
    *,
    issue_number: str,
    summary: str,
    user_impact: str,
    worst_case: str,
    verification_commands: Sequence[str],
    rollback_ref: str,
    skip_reason: str = "N/A (task branch)",
    recovery_note: str = "无",
) -> str:
    verification_lines = [f"- [ ] `{command}`" for command in verification_commands]
    verification_block = "\n".join(verification_lines)
    return f"""Skip-Reason: {skip_reason}

## 主题
- {summary}

## 关联 Issue
- Closes #{issue_number}

## 用户影响
- {user_impact}

## 不修最坏后果
- {worst_case}

## 验证证据
{verification_block}
- 其他补充验证：

## 回滚点
- 回滚 commit/分支：{rollback_ref}
- 回滚后需要恢复的数据或配置：{recovery_note}
""".strip() + "\n"


def has_audit_pass_comment(comment_bodies: Sequence[str]) -> bool:
    return any(AUDIT_PASS_COMMENT_PATTERN.search(body) for body in comment_bodies)


def build_blocker_comment(
    *,
    kind: str,
    pr_url: str,
    merge_state: str | None = None,
    review_decision: str | None = None,
    timeout_seconds: int | None = None,
) -> str:
    normalized_kind = kind.lower()
    if normalized_kind == "review-required":
        return (
            "PR is blocked by `reviewDecision=REVIEW_REQUIRED`. "
            f"Complete independent review before merge. PR: {pr_url}"
        )
    if normalized_kind == "changes-requested":
        return (
            "PR is blocked by `reviewDecision=CHANGES_REQUESTED`; cannot auto-merge. "
            f"PR: {pr_url}"
        )
    if normalized_kind == "merge-conflicts":
        merge_state_value = merge_state or "DIRTY"
        return (
            f"PR is blocked by merge conflicts (`mergeStateStatus={merge_state_value}`). "
            f"Manual conflict resolution is required. PR: {pr_url}"
        )
    if normalized_kind == "merge-timeout":
        timeout_value = timeout_seconds if timeout_seconds is not None else 0
        review_value = review_decision or ""
        merge_value = merge_state or ""
        status_line = f"mergeState={merge_value} reviewDecision={review_value}".strip()
        return (
            "Auto-merge is enabled and checks are green, but the PR has not merged "
            f"after {timeout_value}s. Current status: {status_line}. PR: {pr_url}"
        )
    if normalized_kind == "audit-required":
        return (
            "Auto-merge remains disabled until the designated audit agent posts a "
            "`FINAL-VERDICT` comment with `ACCEPT`. "
            f"PR: {pr_url}"
        )
    raise ValueError(f"Unsupported blocker comment kind: {kind}")


def detect_capabilities_from_environment(
    *,
    override: str,
    env: Mapping[str, str] | None = None,
    which: Callable[[str], str | None] = shutil.which,
    run_command: Callable[[Sequence[str]], CmdResult] | None = None,
    repo_root: str | None = None,
) -> DeliveryCapabilities:
    current_env = os.environ if env is None else env
    gh_installed = detect_gh_installed(which)
    gh_authenticated = False
    if gh_installed:
        gh_authenticated = detect_gh_authenticated(repo_root=repo_root, run_command=run_command)
    mcp_available = parse_env_bool(current_env, "CODEX_GITHUB_MCP_AVAILABLE")
    mcp_write_capable = parse_env_bool(current_env, "CODEX_GITHUB_MCP_WRITE_CAPABLE")
    return select_channel(
        override=override,
        gh_installed=gh_installed,
        gh_authenticated=gh_authenticated,
        mcp_available=mcp_available,
        mcp_write_capable=mcp_write_capable,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="GitHub delivery helpers for agents.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    capabilities_parser = subparsers.add_parser("capabilities", help="Detect delivery channel.")
    capabilities_parser.add_argument(
        "--channel",
        default=os.environ.get("CODEX_GITHUB_CHANNEL", "auto"),
        choices=["auto", "gh", "mcp", "none"],
        help="Preferred GitHub delivery channel.",
    )

    pr_payload_parser = subparsers.add_parser("pr-payload", help="Build PR title/body payload.")
    pr_payload_parser.add_argument("--issue-number", required=True)
    pr_payload_parser.add_argument("--title", required=True)
    pr_payload_parser.add_argument("--summary", required=True)
    pr_payload_parser.add_argument("--user-impact", required=True)
    pr_payload_parser.add_argument("--worst-case", required=True)
    pr_payload_parser.add_argument("--rollback-ref", required=True)
    pr_payload_parser.add_argument(
        "--verification-command",
        action="append",
        dest="verification_commands",
        default=list(DEFAULT_VERIFICATION_COMMANDS),
        help="Repeatable verification command entry.",
    )
    pr_payload_parser.add_argument(
        "--skip-reason",
        default="N/A (task branch)",
    )
    pr_payload_parser.add_argument(
        "--recovery-note",
        default="无",
    )

    audit_parser = subparsers.add_parser("audit-pass", help="Check whether audit-pass comment exists.")
    audit_parser.add_argument("--comments-json", required=True, help="JSON array of PR comment bodies.")

    comment_parser = subparsers.add_parser("comment-payload", help="Build blocker comment.")
    comment_parser.add_argument(
        "--kind",
        required=True,
        choices=["review-required", "changes-requested", "merge-conflicts", "merge-timeout", "audit-required"],
    )
    comment_parser.add_argument("--pr-url", required=True)
    comment_parser.add_argument("--merge-state", default=None)
    comment_parser.add_argument("--review-decision", default=None)
    comment_parser.add_argument("--timeout-seconds", type=int, default=None)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "capabilities":
        capabilities = detect_capabilities_from_environment(override=args.channel)
        print(json.dumps(asdict(capabilities), ensure_ascii=False, indent=2))
        return 0

    if args.command == "pr-payload":
        payload = {
            "title": build_pr_title(args.title, args.issue_number),
            "body": build_pr_body(
                issue_number=args.issue_number,
                summary=args.summary,
                user_impact=args.user_impact,
                worst_case=args.worst_case,
                verification_commands=args.verification_commands,
                rollback_ref=args.rollback_ref,
                skip_reason=args.skip_reason,
                recovery_note=args.recovery_note,
            ),
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    if args.command == "audit-pass":
        comments = json.loads(args.comments_json)
        if not isinstance(comments, list) or not all(isinstance(item, str) for item in comments):
            raise SystemExit("comments-json must be a JSON array of strings")
        print(json.dumps({"audit_pass": has_audit_pass_comment(comments)}, ensure_ascii=False, indent=2))
        return 0

    if args.command == "comment-payload":
        payload = {
            "body": build_blocker_comment(
                kind=args.kind,
                pr_url=args.pr_url,
                merge_state=args.merge_state,
                review_decision=args.review_decision,
                timeout_seconds=args.timeout_seconds,
            )
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    parser.error(f"Unsupported command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
