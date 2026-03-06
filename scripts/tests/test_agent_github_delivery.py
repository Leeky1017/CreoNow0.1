import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import agent_github_delivery  # noqa: E402


class ChannelSelectionTests(unittest.TestCase):
    def test_select_channel_should_prefer_gh_when_cli_is_ready(self) -> None:
        capabilities = agent_github_delivery.select_channel(
            override="auto",
            gh_installed=True,
            gh_authenticated=True,
            mcp_available=True,
            mcp_write_capable=True,
        )
        self.assertEqual("gh", capabilities.selected_channel)
        self.assertIsNone(capabilities.blocker)

    def test_select_channel_should_fallback_to_mcp_when_gh_missing(self) -> None:
        capabilities = agent_github_delivery.select_channel(
            override="auto",
            gh_installed=False,
            gh_authenticated=False,
            mcp_available=True,
            mcp_write_capable=True,
        )
        self.assertEqual("mcp", capabilities.selected_channel)
        self.assertIsNone(capabilities.blocker)

    def test_select_channel_should_report_missing_auth_when_no_fallback_exists(self) -> None:
        capabilities = agent_github_delivery.select_channel(
            override="auto",
            gh_installed=True,
            gh_authenticated=False,
            mcp_available=False,
            mcp_write_capable=False,
        )
        self.assertEqual("none", capabilities.selected_channel)
        self.assertEqual("missing_auth", capabilities.blocker)


class PullRequestTemplateTests(unittest.TestCase):
    def test_build_pr_title_should_append_issue_suffix_once(self) -> None:
        self.assertEqual(
            "Unify delivery control plane (#1005)",
            agent_github_delivery.build_pr_title("Unify delivery control plane", "1005"),
        )
        self.assertEqual(
            "Unify delivery control plane (#1005)",
            agent_github_delivery.build_pr_title("Unify delivery control plane (#1005)", "1005"),
        )

    def test_build_pr_body_should_follow_repository_contract(self) -> None:
        body = agent_github_delivery.build_pr_body(
            issue_number="1005",
            summary="统一 Agent 的 GitHub 交付控制面。",
            user_impact="Agent 可自行完成 PR 与评论收口。",
            worst_case="不同环境下继续出现 PR 交付半途而废。",
            verification_commands=["pytest -q scripts/tests/test_agent_github_delivery.py"],
            rollback_ref="git revert HEAD",
        )
        self.assertIn("Skip-Reason: N/A (task branch)", body)
        self.assertIn("Closes #1005", body)
        self.assertIn("## 验证证据", body)
        self.assertIn("`pytest -q scripts/tests/test_agent_github_delivery.py`", body)


class CommentTemplateTests(unittest.TestCase):
    def test_build_blocker_comment_should_include_status_and_pr_url(self) -> None:
        body = agent_github_delivery.build_blocker_comment(
            kind="review-required",
            pr_url="https://github.com/Leeky1017/CreoNow/pull/1006",
        )
        self.assertIn("reviewDecision=REVIEW_REQUIRED", body)
        self.assertIn("https://github.com/Leeky1017/CreoNow/pull/1006", body)


class AuditGateTests(unittest.TestCase):
    def test_has_audit_pass_comment_should_require_final_verdict_accept(self) -> None:
        self.assertTrue(
            agent_github_delivery.has_audit_pass_comment(
                [
                    "## FINAL-VERDICT：Issue #1005\n\n### 最终判定：ACCEPT",
                ]
            )
        )
        self.assertFalse(
            agent_github_delivery.has_audit_pass_comment(
                [
                    "## PRE-AUDIT：Issue #1005\n\n### 初始阻断结论：REJECT",
                    "## FINAL-VERDICT：Issue #1005\n\n### 最终判定：REJECT",
                ]
            )
        )

    def test_build_blocker_comment_should_explain_audit_requirement(self) -> None:
        body = agent_github_delivery.build_blocker_comment(
            kind="audit-required",
            pr_url="https://github.com/Leeky1017/CreoNow/pull/1006",
        )
        self.assertIn("FINAL-VERDICT", body)
        self.assertIn("ACCEPT", body)
        self.assertIn("https://github.com/Leeky1017/CreoNow/pull/1006", body)


if __name__ == "__main__":
    unittest.main()
