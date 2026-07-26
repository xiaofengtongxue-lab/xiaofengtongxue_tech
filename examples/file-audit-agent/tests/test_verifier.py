from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from file_audit_agent.config import Settings
from file_audit_agent.tools import WorkspaceTools
from file_audit_agent.verifier import verify_report


class VerifierTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "a.md").write_text("TODO\n", encoding="utf-8")
        self.settings = Settings(root=self.root)
        self.tools = WorkspaceTools(self.settings)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_accepts_evidence_backed_report(self) -> None:
        report = """# 资料盘点报告

文件总数：1

## 文件概况

- `a.md` 是文本资料。

## 需要关注

- `a.md` 中还有待办。

## 建议下一步

- 人工确认待办是否仍有效。
"""
        self.tools.save_report_draft(report)
        result = verify_report(self.tools, self.settings.draft_path)
        self.assertTrue(result.passed, result.issues)

    def test_rejects_wrong_count_and_fake_path(self) -> None:
        report = """# 资料盘点报告

文件总数：9

## 文件概况

- `missing.md`

## 需要关注

- 无。

## 建议下一步

- 检查。
"""
        self.tools.save_report_draft(report)
        result = verify_report(self.tools, self.settings.draft_path)
        self.assertFalse(result.passed)
        self.assertTrue(any("总数" in issue for issue in result.issues))
        self.assertTrue(any("不存在" in issue for issue in result.issues))


if __name__ == "__main__":
    unittest.main()
