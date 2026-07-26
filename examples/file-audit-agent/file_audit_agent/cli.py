from __future__ import annotations

import argparse
import os
import secrets
import sys
from pathlib import Path

from .agent import FileAuditAgent
from .approval import make_approval_request, publish_report
from .config import Settings
from .model import OpenAIResponsesModel
from .tools import WorkspaceTools


DEFAULT_GOAL = (
    "盘点这个工作目录：统计文件，找出包含 TODO 或 FIXME 的文本，"
    "生成一份带真实路径证据的资料清单。不要修改原文件。"
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the tutorial file-audit agent")
    parser.add_argument("--root", type=Path, required=True, help="只允许 Agent 访问的工作目录")
    parser.add_argument("--goal", default=DEFAULT_GOAL, help="本次盘点目标")
    parser.add_argument(
        "--model",
        default=os.getenv("OPENAI_MODEL", "gpt-5.6-terra"),
        help="当前 API 项目可用的模型 ID",
    )
    parser.add_argument("--max-steps", type=int, default=10)
    parser.add_argument("--resume", help="从 .agent/checkpoints 中恢复指定 run_id")
    parser.add_argument("--draft-only", action="store_true", help="验收后保留草稿，不请求发布")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if not os.getenv("OPENAI_API_KEY"):
        print("缺少 OPENAI_API_KEY。请只在自己的终端设置，不要写进项目文件。", file=sys.stderr)
        return 2

    settings = Settings(
        root=args.root,
        model=args.model,
        max_steps=args.max_steps,
    )
    tools = WorkspaceTools(settings)
    agent = FileAuditAgent(
        settings=settings,
        model=OpenAIResponsesModel(settings.model),
        tools=tools,
    )
    result = agent.run(args.goal, resume_run_id=args.resume)

    print(f"\n草稿已通过验收：{result.draft_path}")
    print(f"真实文件数：{result.verification.actual_file_count}")
    print(f"运行编号：{result.state.run_id}")
    if result.final_text:
        print(f"模型说明：{result.final_text.strip()}")

    if args.draft_only:
        print("已按 --draft-only 停在草稿阶段。")
        return 0

    token = secrets.token_hex(3)
    request = make_approval_request(result.draft_path, token)
    print("\n请先打开草稿检查。确认发布时输入下面这行原文：")
    print(request.confirmation_text)
    confirmation = input("> ")
    try:
        report_path = publish_report(
            draft_path=result.draft_path,
            report_path=settings.report_path,
            request=request,
            confirmation=confirmation,
        )
    except PermissionError as exc:
        print(str(exc), file=sys.stderr)
        return 3

    print(f"报告已发布：{report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
