from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from file_audit_agent.config import Settings
from file_audit_agent.tools import WorkspaceTools


class WorkspaceToolsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "notes").mkdir()
        (self.root / "notes" / "todo.md").write_text("TODO: verify links\n", encoding="utf-8")
        self.tools = WorkspaceTools(Settings(root=self.root))

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_lists_and_searches_real_files(self) -> None:
        listed = self.tools.list_files(".")
        self.assertEqual(listed["returned"], 1)
        self.assertEqual(listed["files"][0]["path"], "notes/todo.md")

        searched = self.tools.search_text("todo", ".")
        self.assertEqual(searched["matches"][0]["line"], 1)

    def test_rejects_path_traversal(self) -> None:
        result = self.tools.dispatch("read_text_file", '{"path":"../secret.txt"}')
        self.assertFalse(result["ok"])
        self.assertEqual(result["error_code"], "invalid_tool_call")

    def test_draft_is_not_visible_source_material(self) -> None:
        self.tools.save_report_draft("# Draft")
        listed = self.tools.list_files(".")
        self.assertEqual(listed["returned"], 1)


if __name__ == "__main__":
    unittest.main()
