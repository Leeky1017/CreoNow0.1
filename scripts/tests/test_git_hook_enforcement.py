import os
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PRE_COMMIT = REPO_ROOT / '.githooks' / 'pre-commit'
PRE_PUSH = REPO_ROOT / '.githooks' / 'pre-push'


def run(cmd, *, cwd, env=None, input_text=None):
    return subprocess.run(
        cmd,
        cwd=cwd,
        env=env,
        input=input_text,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


class GitHookEnforcementTests(unittest.TestCase):
    def test_hook_files_should_exist_and_be_executable(self) -> None:
        for hook in (PRE_COMMIT, PRE_PUSH):
            with self.subTest(hook=hook.name):
                self.assertTrue(hook.exists())
                mode = hook.stat().st_mode
                self.assertTrue(mode & stat.S_IXUSR)

    def test_pre_commit_should_block_controlplane_root_main(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp) / 'repo'
            run(['git', 'init', '-b', 'main', str(repo)], cwd=Path(tmp))
            proc = run([str(PRE_COMMIT)], cwd=repo)
            self.assertNotEqual(0, proc.returncode)
            self.assertIn('controlplane root', proc.stderr)

    def test_pre_commit_should_allow_bypass(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp) / 'repo'
            run(['git', 'init', '-b', 'main', str(repo)], cwd=Path(tmp))
            env = os.environ.copy()
            env['CREONOW_ALLOW_CONTROLPLANE_BYPASS'] = '1'
            proc = run([str(PRE_COMMIT)], cwd=repo, env=env)
            self.assertEqual(0, proc.returncode)

    def test_pre_commit_should_allow_task_branch_in_secondary_worktree(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp) / 'repo'
            run(['git', 'init', '-b', 'main', str(repo)], cwd=Path(tmp))
            (repo / 'README.md').write_text('seed\n', encoding='utf-8')
            run(['git', 'add', 'README.md'], cwd=repo)
            run(['git', 'commit', '-m', 'seed'], cwd=repo, env={**os.environ, 'GIT_AUTHOR_NAME':'t','GIT_AUTHOR_EMAIL':'t@example.com','GIT_COMMITTER_NAME':'t','GIT_COMMITTER_EMAIL':'t@example.com'})
            worktree = Path(tmp) / 'repo-task'
            run(['git', 'worktree', 'add', '-b', 'task/1-demo', str(worktree), 'main'], cwd=repo)
            proc = run([str(PRE_COMMIT)], cwd=worktree)
            self.assertEqual(0, proc.returncode, proc.stderr)

    def test_pre_push_should_block_push_to_main(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp) / 'repo'
            run(['git', 'init', '-b', 'main', str(repo)], cwd=Path(tmp))
            (repo / 'README.md').write_text('seed\n', encoding='utf-8')
            run(['git', 'add', 'README.md'], cwd=repo)
            run(['git', 'commit', '-m', 'seed'], cwd=repo, env={**os.environ, 'GIT_AUTHOR_NAME':'t','GIT_AUTHOR_EMAIL':'t@example.com','GIT_COMMITTER_NAME':'t','GIT_COMMITTER_EMAIL':'t@example.com'})
            worktree = Path(tmp) / 'repo-task'
            run(['git', 'worktree', 'add', '-b', 'task/1-demo', str(worktree), 'main'], cwd=repo)
            proc = run(
                [str(PRE_PUSH), 'origin', 'https://example.com/repo.git'],
                cwd=worktree,
                input_text='refs/heads/task/1-demo localsha refs/heads/main remotesha\n',
            )
            self.assertNotEqual(0, proc.returncode)
            self.assertIn('direct pushes to main are blocked', proc.stderr)


if __name__ == '__main__':
    unittest.main()
