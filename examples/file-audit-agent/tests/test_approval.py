from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from file_audit_agent.approval import make_approval_request, publish_report


class ApprovalTest(unittest.TestCase):
    def test_requires_matching_confirmation_and_unchanged_draft(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            draft = root / "draft.md"
            target = root / "reports" / "inventory.md"
            draft.write_text("# Draft\n", encoding="utf-8")
            request = make_approval_request(draft, "abc123")

            with self.assertRaises(PermissionError):
                publish_report(
                    draft_path=draft,
                    report_path=target,
                    request=request,
                    confirmation="yes",
                )
            self.assertFalse(target.exists())

            published = publish_report(
                draft_path=draft,
                report_path=target,
                request=request,
                confirmation="APPROVE abc123",
            )
            self.assertEqual(published.read_text(encoding="utf-8"), "# Draft\n")


if __name__ == "__main__":
    unittest.main()
