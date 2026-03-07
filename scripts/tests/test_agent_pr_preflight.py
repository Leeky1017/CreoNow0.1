"""Tests for agent_pr_preflight.py (simplified delivery contract).

"""
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import agent_pr_preflight  # noqa: E402


class BranchContractTests(unittest.TestCase):
    """Branch must be task/<N>-<slug>."""

    def test_main_should_fail_when_branch_is_not_task_format(self) -> None:
        with mock.patch.object(
            agent_pr_preflight,
            "git_root",
            return_value="/tmp/repo",
        ), mock.patch.object(
            agent_pr_preflight,
            "current_branch",
            return_value="feature/some-branch",
        ):
            rc = agent_pr_preflight.main()
        self.assertEqual(1, rc)

    def test_main_should_fail_when_branch_has_uppercase_slug(self) -> None:
        with mock.patch.object(
            agent_pr_preflight,
            "git_root",
            return_value="/tmp/repo",
        ), mock.patch.object(
            agent_pr_preflight,
            "current_branch",
            return_value="task/42-SomeFeature",
        ):
            rc = agent_pr_preflight.main()
        self.assertEqual(1, rc)

    def test_main_should_fail_when_branch_missing_issue_number(self) -> None:
        with mock.patch.object(
            agent_pr_preflight,
            "git_root",
            return_value="/tmp/repo",
        ), mock.patch.object(
            agent_pr_preflight,
            "current_branch",
            return_value="task/no-number-slug",
        ):
            rc = agent_pr_preflight.main()
        self.assertEqual(1, rc)


class IssueStateTests(unittest.TestCase):
    """Issue must be OPEN."""

    def test_validate_issue_is_open_should_pass_when_open(self) -> None:
        payload = '{"number": 42, "state": "OPEN", "title": "test", "url": "https://example.com"}'
        with mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(0, payload),
        ):
            agent_pr_preflight.validate_issue_is_open("/tmp/repo", "42")

    def test_validate_issue_is_open_should_fail_when_closed(self) -> None:
        payload = '{"number": 42, "state": "closed", "title": "test", "url": "https://example.com"}'
        with mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(0, payload),
        ):
            with self.assertRaisesRegex(RuntimeError, r"\[ISSUE\].*CLOSED.*expected OPEN"):
                agent_pr_preflight.validate_issue_is_open("/tmp/repo", "42")

    def test_validate_issue_is_open_should_fail_when_gh_errors(self) -> None:
        with mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(1, "not found"),
        ):
            with self.assertRaisesRegex(RuntimeError, r"\[ISSUE\].*failed to query"):
                agent_pr_preflight.validate_issue_is_open("/tmp/repo", "99")


class PRBodyFormatTests(unittest.TestCase):
    """PR body must contain Closes #<N>."""

    def test_validate_pr_body_format_should_pass_with_closes(self) -> None:
        pr = agent_pr_preflight.PullRequest(
            number=100,
            body="Some description\n\nCloses #42\n",
            url="https://github.com/test/test/pull/100",
        )
        agent_pr_preflight.validate_pr_body_format(pr, "42")

    def test_validate_pr_body_format_should_pass_case_insensitive(self) -> None:
        pr = agent_pr_preflight.PullRequest(
            number=100,
            body="closes #42",
            url="https://github.com/test/test/pull/100",
        )
        agent_pr_preflight.validate_pr_body_format(pr, "42")

    def test_validate_pr_body_format_should_fail_without_closes(self) -> None:
        pr = agent_pr_preflight.PullRequest(
            number=100,
            body="No issue reference here",
            url="https://github.com/test/test/pull/100",
        )
        with self.assertRaisesRegex(RuntimeError, r"\[PR\].*must contain.*Closes #42"):
            agent_pr_preflight.validate_pr_body_format(pr, "42")

    def test_validate_pr_body_format_should_fail_with_wrong_issue(self) -> None:
        pr = agent_pr_preflight.PullRequest(
            number=100,
            body="Closes #99",
            url="https://github.com/test/test/pull/100",
        )
        with self.assertRaisesRegex(RuntimeError, r"\[PR\].*must contain.*Closes #42"):
            agent_pr_preflight.validate_pr_body_format(pr, "42")


class QueryOpenPRTests(unittest.TestCase):
    """PR query should handle payloads correctly."""

    def test_query_open_pr_should_fail_when_no_pr_found(self) -> None:
        with mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(0, "[]"),
        ):
            with self.assertRaisesRegex(RuntimeError, r"\[PR\].*no open PR found"):
                agent_pr_preflight.query_open_pr_for_branch("/tmp/repo", "task/42-test")

    def test_query_open_pr_should_parse_valid_payload(self) -> None:
        payload = '[{"number": 100, "body": "Closes #42", "url": "https://github.com/test/pull/100"}]'
        with mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(0, payload),
        ):
            pr = agent_pr_preflight.query_open_pr_for_branch("/tmp/repo", "task/42-test")
        self.assertEqual(100, pr.number)
        self.assertEqual("Closes #42", pr.body)

    def test_query_open_pr_should_fail_on_invalid_json(self) -> None:
        with mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(0, "not json"),
        ):
            with self.assertRaisesRegex(RuntimeError, r"\[PR\].*invalid JSON"):
                agent_pr_preflight.query_open_pr_for_branch("/tmp/repo", "task/42-test")

    def test_query_open_pr_should_handle_null_body(self) -> None:
        payload = '[{"number": 100, "body": null, "url": "https://github.com/test/pull/100"}]'
        with mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(0, payload),
        ):
            pr = agent_pr_preflight.query_open_pr_for_branch("/tmp/repo", "task/42-test")
        self.assertEqual("", pr.body)


class EndToEndFlowTests(unittest.TestCase):
    """Full main() success and failure paths."""

    def _mock_valid_flow(self) -> tuple:
        issue_payload = '{"number": 42, "state": "OPEN", "title": "test", "url": "https://example.com"}'
        pr_payload = '[{"number": 100, "body": "Closes #42", "url": "https://github.com/test/pull/100"}]'

        git_root_mock = mock.patch.object(
            agent_pr_preflight, "git_root", return_value="/tmp/repo"
        )
        branch_mock = mock.patch.object(
            agent_pr_preflight, "current_branch", return_value="task/42-memory-decay"
        )

        def run_side_effect(cmd, *, cwd=None):
            if "issue" in cmd:
                return agent_pr_preflight.CmdResult(0, issue_payload)
            return agent_pr_preflight.CmdResult(0, pr_payload)

        run_mock = mock.patch.object(agent_pr_preflight, "run", side_effect=run_side_effect)
        return git_root_mock, branch_mock, run_mock

    def test_main_should_pass_with_valid_flow(self) -> None:
        gm, bm, rm = self._mock_valid_flow()
        with gm, bm, rm:
            rc = agent_pr_preflight.main()
        self.assertEqual(0, rc)

    def test_main_should_fail_when_issue_is_closed(self) -> None:
        closed_payload = '{"number": 42, "state": "closed", "title": "test", "url": "https://example.com"}'
        with mock.patch.object(
            agent_pr_preflight, "git_root", return_value="/tmp/repo"
        ), mock.patch.object(
            agent_pr_preflight, "current_branch", return_value="task/42-memory-decay"
        ), mock.patch.object(
            agent_pr_preflight,
            "run",
            return_value=agent_pr_preflight.CmdResult(0, closed_payload),
        ):
            rc = agent_pr_preflight.main()
        self.assertEqual(1, rc)


if __name__ == "__main__":
    unittest.main()
