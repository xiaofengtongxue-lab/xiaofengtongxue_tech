from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from file_audit_agent.agent import FileAuditAgent
from file_audit_agent.config import Settings
from file_audit_agent.model import ModelTurn, ToolCall
from file_audit_agent.tools import WorkspaceTools


class ScriptedModel:
    def __init__(self, turns: list[ModelTurn]) -> None:
        self.turns = iter(turns)

    def complete(self, **_: object) -> ModelTurn:
        return next(self.turns)


def tool_turn(call_id: str, name: str, arguments: dict[str, object]) -> ModelTurn:
    raw = json.dumps(arguments, ensure_ascii=False)
    item = {
        "type": "function_call",
        "call_id": call_id,
        "name": name,
        "arguments": raw,
    }
    return ModelTurn(
        items=[item],
        tool_calls=[ToolCall(call_id=call_id, name=name, arguments=raw)],
        output_text="",
    )


class FileAuditAgentTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "a.md").write_text("TODO: check\n", encoding="utf-8")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_completes_only_after_report_passes_verification(self) -> None:
        report = """# 资料盘点报告

文件总数：1

## 文件概况

- `a.md` 是文本资料。

## 需要关注

- `a.md` 有一条待办。

## 建议下一步

- 人工核对待办。
"""
        model = ScriptedModel(
            [
                tool_turn("call-1", "list_files", {"relative_dir": "."}),
                tool_turn("call-2", "search_text", {"query": "TODO", "relative_dir": "."}),
                tool_turn("call-3", "save_report_draft", {"content": report}),
                ModelTurn(items=[], tool_calls=[], output_text="草稿已生成，等待人工确认。"),
            ]
        )
        settings = Settings(root=self.root, max_steps=6)
        tools = WorkspaceTools(settings)
        result = FileAuditAgent(settings=settings, model=model, tools=tools).run("盘点目录")

        self.assertTrue(result.verification.passed)
        self.assertEqual(result.state.status, "ready_for_approval")
        self.assertEqual(len(result.state.tool_events), 3)

    def test_stops_repeated_tool_loop(self) -> None:
        repeated = [tool_turn(f"call-{index}", "list_files", {"relative_dir": "."}) for index in range(3)]
        settings = Settings(root=self.root, max_steps=5, max_tool_repeats=3)
        tools = WorkspaceTools(settings)
        agent = FileAuditAgent(
            settings=settings,
            model=ScriptedModel(repeated),
            tools=tools,
        )

        with self.assertRaisesRegex(RuntimeError, "无效循环"):
            agent.run("盘点目录")


if __name__ == "__main__":
    unittest.main()
