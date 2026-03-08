import json
import subprocess
from pathlib import Path
import unittest


REPO_ROOT = Path(__file__).resolve().parents[2]


class VsCodeAgentGuidanceTests(unittest.TestCase):
    def test_workspace_settings_should_enable_instruction_loading(self) -> None:
        settings_path = REPO_ROOT / ".vscode" / "settings.json"
        self.assertTrue(settings_path.exists(), ".vscode/settings.json must exist")

        settings = json.loads(settings_path.read_text(encoding="utf-8"))
        self.assertTrue(settings.get("chat.useAgentsMdFile"))
        self.assertTrue(settings.get("chat.includeApplyingInstructions"))
        self.assertTrue(settings.get("chat.includeReferencedInstructions"))
        self.assertIn(
            ".github/instructions",
            settings.get("chat.instructionsFilesLocations", []),
        )


    def test_workspace_settings_should_not_be_gitignored(self) -> None:
        proc = subprocess.run(
            ["git", "check-ignore", ".vscode/settings.json"],
            cwd=REPO_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        self.assertNotEqual(0, proc.returncode, ".vscode/settings.json must be committable")

    def test_repo_wide_copilot_instructions_should_cover_github_delivery(self) -> None:
        path = REPO_ROOT / ".github" / "copilot-instructions.md"
        self.assertTrue(path.exists(), ".github/copilot-instructions.md must exist")
        text = path.read_text(encoding="utf-8")
        self.assertIn("python3 scripts/agent_github_delivery.py capabilities", text)
        self.assertIn("FINAL-VERDICT", text)
        self.assertIn("--enable-auto-merge", text)
        self.assertIn("missing_tool / missing_auth / missing_permission", text)
        self.assertIn("scripts/agent_task_begin.sh", text)

    def test_delivery_prompt_should_exist_for_vscode_agent_mode(self) -> None:
        path = REPO_ROOT / ".github" / "prompts" / "creonow-delivery.prompt.md"
        self.assertTrue(path.exists(), ".github/prompts/creonow-delivery.prompt.md must exist")
        text = path.read_text(encoding="utf-8")
        self.assertIn("scripts/agent_task_begin.sh", text)
        self.assertIn("scripts/agent_pr_preflight.sh", text)
        self.assertIn("scripts/agent_github_delivery.py pr-payload", text)
        self.assertIn("FINAL-VERDICT", text)

    def test_agents_and_claude_should_match_audit_first_policy(self) -> None:
        expected_phrases = (
            "auto-merge 默认关闭",
            "FINAL-VERDICT",
            "ACCEPT",
        )
        for relative_path in ("AGENTS.md", "CLAUDE.md"):
            text = (REPO_ROOT / relative_path).read_text(encoding="utf-8")
            for phrase in expected_phrases:
                with self.subTest(path=relative_path, phrase=phrase):
                    self.assertIn(phrase, text)

    def test_audit_prompt_and_agent_should_exist(self) -> None:
        prompt_path = REPO_ROOT / ".github" / "prompts" / "creonow-audit.prompt.md"
        agent_path = REPO_ROOT / ".github" / "agents" / "creonow-audit.agent.md"
        self.assertTrue(prompt_path.exists(), ".github/prompts/creonow-audit.prompt.md must exist")
        self.assertTrue(agent_path.exists(), ".github/agents/creonow-audit.agent.md must exist")

        prompt_text = prompt_path.read_text(encoding="utf-8")
        self.assertIn("PRE-AUDIT", prompt_text)
        self.assertIn("RE-AUDIT", prompt_text)
        self.assertIn("FINAL-VERDICT", prompt_text)
        self.assertIn("git diff --numstat", prompt_text)

        agent_text = agent_path.read_text(encoding="utf-8")
        self.assertIn("FINAL-VERDICT", agent_text)
        self.assertIn("ACCEPT", agent_text)

    def test_fix_ci_prompt_and_agent_should_exist(self) -> None:
        prompt_path = REPO_ROOT / ".github" / "prompts" / "creonow-fix-ci.prompt.md"
        agent_path = REPO_ROOT / ".github" / "agents" / "creonow-fix-ci.agent.md"
        self.assertTrue(prompt_path.exists(), ".github/prompts/creonow-fix-ci.prompt.md must exist")
        self.assertTrue(agent_path.exists(), ".github/agents/creonow-fix-ci.agent.md must exist")

        prompt_text = prompt_path.read_text(encoding="utf-8")
        self.assertIn("scripts/agent_pr_preflight.sh", prompt_text)
        self.assertIn("python3 scripts/agent_github_delivery.py capabilities", prompt_text)
        self.assertIn("evidence", prompt_text.lower())
        self.assertIn("ci", prompt_text.lower())

        agent_text = agent_path.read_text(encoding="utf-8")
        self.assertIn("ci", agent_text.lower())
        self.assertIn("Issue", agent_text)

    def test_repo_wide_instructions_should_point_to_all_specialized_entrypoints(self) -> None:
        text = (REPO_ROOT / ".github" / "copilot-instructions.md").read_text(encoding="utf-8")
        self.assertIn("creonow-delivery", text)
        self.assertIn("creonow-audit", text)
        self.assertIn("creonow-fix-ci", text)


if __name__ == "__main__":
    unittest.main()
