import os
import stat
import unittest


class ScriptPermissionTests(unittest.TestCase):
    def test_critical_shell_scripts_should_be_executable(self) -> None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        expected_scripts = (
            "agent_controlplane_sync.sh",
            "agent_git_hooks_install.sh",
            "agent_task_begin.sh",
            "agent_worktree_setup.sh",
            "agent_worktree_cleanup.sh",
            "agent_pr_preflight.sh",
            "agent_pr_automerge_and_sync.sh",
        )
        for script_name in expected_scripts:
            with self.subTest(script=script_name):
                script_path = os.path.join(repo_root, "scripts", script_name)
                mode = os.stat(script_path).st_mode
                self.assertTrue(
                    mode & stat.S_IXUSR,
                    f"scripts/{script_name} must be executable (chmod +x)",
                )


if __name__ == "__main__":
    unittest.main()
