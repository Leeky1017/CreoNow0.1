import os
import stat
import unittest


class ScriptPermissionTests(unittest.TestCase):
    def test_main_audit_resign_should_be_executable(self) -> None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        script_path = os.path.join(repo_root, "scripts", "main_audit_resign.sh")
        mode = os.stat(script_path).st_mode
        self.assertTrue(
            mode & stat.S_IXUSR,
            "scripts/main_audit_resign.sh must be executable (chmod +x)",
        )


if __name__ == "__main__":
    unittest.main()
