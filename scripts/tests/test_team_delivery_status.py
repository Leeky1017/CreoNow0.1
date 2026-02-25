import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import team_delivery_status  # noqa: E402


class ParseCheckStateTests(unittest.TestCase):
    def test_parse_check_state_uses_name_and_conclusion(self) -> None:
        name, state = team_delivery_status.parse_check_state(
            {
                "name": "ci",
                "status": "COMPLETED",
                "conclusion": "SUCCESS",
            }
        )

        self.assertEqual("ci", name)
        self.assertEqual("SUCCESS", state)

    def test_parse_check_state_supports_status_context_state_field(self) -> None:
        name, state = team_delivery_status.parse_check_state(
            {
                "context": "merge-serial",
                "state": "SUCCESS",
            }
        )

        self.assertEqual("merge-serial", name)
        self.assertEqual("SUCCESS", state)


class FetchPrStatusTests(unittest.TestCase):
    def test_fetch_pr_status_maps_required_checks_from_status_context_state(self) -> None:
        payload = {
            "url": "https://github.com/owner/repo/pull/1",
            "state": "OPEN",
            "mergeStateStatus": "CLEAN",
            "autoMergeRequest": {"enabledAt": "2026-02-25T00:00:00Z"},
            "statusCheckRollup": [
                {"name": "ci", "status": "COMPLETED", "conclusion": "SUCCESS"},
                {"context": "openspec-log-guard", "state": "SUCCESS"},
                {"context": "merge-serial", "state": "SUCCESS"},
            ],
        }
        run_result = team_delivery_status.CmdResult(code=0, out=json.dumps(payload))
        with mock.patch.object(team_delivery_status, "run", return_value=run_result):
            result = team_delivery_status.fetch_pr_status("/tmp/repo", "1")

        self.assertTrue(result["available"])
        self.assertEqual("success", result["required_checks"]["ci"])
        self.assertEqual("success", result["required_checks"]["openspec-log-guard"])
        self.assertEqual("success", result["required_checks"]["merge-serial"])


if __name__ == "__main__":
    unittest.main()
