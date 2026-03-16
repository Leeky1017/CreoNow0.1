import os
import stat
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


class ReviewAuditCommandContractTests(unittest.TestCase):
    def test_tier_d_uses_exec_or_node_wrappers_for_workspace_commands(self) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        script_path = repo_root / 'scripts' / 'review-audit.sh'

        with tempfile.TemporaryDirectory(prefix='review-audit-bin-') as bin_dir, tempfile.NamedTemporaryFile(prefix='review-audit-log-', delete=False) as log_file:
            log_path = Path(log_file.name)
            bin_path = Path(bin_dir)

            (bin_path / 'pnpm').write_text(
                textwrap.dedent(
                    f"""#!/usr/bin/env bash
                    echo "pnpm:$*" >> {log_path}
                    case "$*" in
                      "-C apps/desktop exec vitest run"*|"typecheck"|"lint")
                        exit 0
                        ;;
                      "-C apps/desktop vitest run"*|"-C apps/desktop tsx "*)
                        exit 42
                        ;;
                      *)
                        exit 0
                        ;;
                    esac
                    """
                )
            )
            (bin_path / 'pytest').write_text(
                textwrap.dedent(
                    f"""#!/usr/bin/env bash
                    echo "pytest:$*" >> {log_path}
                    exit 0
                    """
                )
            )
            (bin_path / 'node').write_text(
                textwrap.dedent(
                    f"""#!/usr/bin/env bash
                    echo "node:$*" >> {log_path}
                    exit 0
                    """
                )
            )

            for name in ('pnpm', 'pytest', 'node'):
                os.chmod(bin_path / name, stat.S_IRWXU)

            env = os.environ.copy()
            env['PATH'] = f"{bin_dir}:{env['PATH']}"

            result = subprocess.run(
                ['bash', str(script_path), 'D', 'HEAD'],
                cwd=repo_root,
                env=env,
                text=True,
                capture_output=True,
                check=False,
            )

            self.assertEqual(
                result.returncode,
                0,
                msg=(
                    'Tier D wrapper should succeed with fake command wrappers when it uses '
                    'pnpm exec / node --import tsx correctly.\n'
                    f'stdout:\n{result.stdout}\n\nstderr:\n{result.stderr}'
                ),
            )

            log_text = log_path.read_text()
            self.assertIn('pnpm:-C apps/desktop exec vitest run', log_text)
            self.assertNotIn('pnpm:-C apps/desktop vitest run', log_text)
            self.assertNotIn('pnpm:-C apps/desktop tsx ', log_text)
            self.assertIn('node:--import tsx scripts/architecture-health-gate.ts', log_text)
            self.assertIn('node:--import tsx scripts/cross-module-contract-gate.ts', log_text)


if __name__ == '__main__':
    unittest.main()
