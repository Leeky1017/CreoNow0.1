import os
import shutil
import stat
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_SOURCE = REPO_ROOT / "scripts" / "agent_pr_automerge_and_sync.sh"


class AgentPRAutomergeAndSyncTests(unittest.TestCase):
    def _write_executable(self, path: Path, content: str) -> None:
        path.write_text(content)
        path.chmod(path.stat().st_mode | stat.S_IXUSR)

    def _make_sandbox(self, *, pr_merged: bool) -> tuple[Path, Path]:
        temp_dir = Path(tempfile.mkdtemp(prefix="automerge-script-"))
        controlplane_root = temp_dir / "repo"
        worktree = controlplane_root / ".worktrees" / "issue-42-demo"
        scripts_dir = worktree / "scripts"
        fake_bin = temp_dir / "bin"

        worktree.mkdir(parents=True)
        scripts_dir.mkdir(parents=True)
        fake_bin.mkdir(parents=True)
        (controlplane_root / ".git").mkdir(parents=True)

        shutil.copy2(SCRIPT_SOURCE, scripts_dir / "agent_pr_automerge_and_sync.sh")
        (scripts_dir / "agent_pr_automerge_and_sync.sh").chmod(
            (scripts_dir / "agent_pr_automerge_and_sync.sh").stat().st_mode | stat.S_IXUSR
        )

        self._write_executable(
            scripts_dir / "agent_pr_preflight.sh",
            "#!/usr/bin/env bash\n"
            "echo 'PRE-FLIGHT FAILED: [ISSUE] issue #42 state is CLOSED; expected OPEN' >&2\n"
            "exit 1\n",
        )
        self._write_executable(
            scripts_dir / "agent_controlplane_sync.sh",
            "#!/usr/bin/env bash\n"
            "echo sync >> \"${SYNC_LOG:?}\"\n",
        )
        (scripts_dir / "agent_github_delivery.py").write_text(
            textwrap.dedent(
                """
                #!/usr/bin/env python3
                import json
                import sys

                command = sys.argv[1]
                if command == "capabilities":
                    print(json.dumps({
                        "selected_channel": "gh",
                        "blocker": None,
                        "reason": "test",
                    }))
                elif command == "comment-payload":
                    print(json.dumps({"body": "comment"}))
                elif command == "audit-pass":
                    print(json.dumps({"audit_pass": True}))
                else:
                    raise SystemExit(f"unsupported command: {command}")
                """
            ).strip()
            + "\n"
        )

        self._write_executable(
            fake_bin / "git",
            textwrap.dedent(
                f"""
                #!/usr/bin/env python3
                import os
                import sys

                repo_root = {repr(str(worktree))}
                controlplane_root = {repr(str(controlplane_root))}
                common_dir = {repr(str(controlplane_root / '.git'))}
                synced_sha = "abc123"

                args = sys.argv[1:]
                if args[:2] == ["rev-parse", "--show-toplevel"]:
                    print(repo_root)
                elif args[:2] == ["rev-parse", "--git-common-dir"]:
                    print(common_dir)
                elif args[:2] == ["rev-parse", "--abbrev-ref"]:
                    print("task/42-demo")
                elif args[:2] == ["status", "--porcelain=v1"]:
                    pass
                elif args[:2] == ["fetch", "origin"]:
                    pass
                elif args[:2] == ["rebase", "origin/main"]:
                    pass
                elif args[:1] == ["push"]:
                    pass
                elif len(args) >= 4 and args[0] == "-C" and args[2:4] == ["rev-parse", "main"]:
                    print(synced_sha)
                elif len(args) >= 4 and args[0] == "-C" and args[2:4] == ["rev-parse", "origin/main"]:
                    print(synced_sha)
                else:
                    raise SystemExit(f"unexpected git args: {{args}}")
                """
            ).strip()
            + "\n",
        )

        merged_at = "2026-03-11T00:53:12Z" if pr_merged else ""
        self._write_executable(
            fake_bin / "gh",
            textwrap.dedent(
                f"""
                #!/usr/bin/env python3
                import json
                import sys

                merged_at = {repr(merged_at)}
                pr_url = "https://example.com/pr/7"

                args = sys.argv[1:]
                if args[:3] == ["pr", "view", "7"] and "--jq" in args:
                    jq = args[args.index("--jq") + 1]
                    if jq.startswith(".mergedAt //"):
                        print(merged_at)
                    elif jq == ".url":
                        print(pr_url)
                    else:
                        raise SystemExit(f"unexpected gh jq: {{jq}}")
                elif args[:2] == ["pr", "list"] and "--jq" in args:
                    print("")
                elif args[:3] == ["pr", "comment", "7"]:
                    pass
                else:
                    raise SystemExit(f"unexpected gh args: {{args}}")
                """
            ).strip()
            + "\n",
        )

        self._write_executable(
            fake_bin / "sleep",
            "#!/usr/bin/env bash\n"
            "echo sleep >> \"${SLEEP_LOG:?}\"\n"
            "exit 99\n",
        )

        return temp_dir, worktree

    def _run_script(self, worktree: Path, temp_dir: Path, *, extra_args: list[str]) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        env["PATH"] = f"{temp_dir / 'bin'}:{env['PATH']}"
        env["SYNC_LOG"] = str(temp_dir / "sync.log")
        env["SLEEP_LOG"] = str(temp_dir / "sleep.log")
        return subprocess.run(
            [
                str(worktree / "scripts" / "agent_pr_automerge_and_sync.sh"),
                "--pr",
                "7",
                "--no-create",
                *extra_args,
            ],
            cwd=worktree,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )

    def test_should_treat_merged_pr_as_terminal_success_when_issue_is_closed(self) -> None:
        temp_dir, worktree = self._make_sandbox(pr_merged=True)
        try:
            result = self._run_script(worktree, temp_dir, extra_args=["--enable-auto-merge"])
            self.assertEqual(0, result.returncode, result.stdout)
            self.assertIn("already merged", result.stdout)
            self.assertTrue((temp_dir / "sync.log").exists(), result.stdout)
            self.assertFalse((temp_dir / "sleep.log").exists(), result.stdout)
        finally:
            shutil.rmtree(temp_dir)

    def test_should_not_bypass_closed_issue_when_pr_is_not_merged(self) -> None:
        temp_dir, worktree = self._make_sandbox(pr_merged=False)
        try:
            result = self._run_script(worktree, temp_dir, extra_args=["--no-wait-preflight"])
            self.assertEqual(1, result.returncode, result.stdout)
            self.assertIn("preflight reported issues", result.stdout)
            self.assertFalse((temp_dir / "sync.log").exists(), result.stdout)
        finally:
            shutil.rmtree(temp_dir)


if __name__ == "__main__":
    unittest.main()