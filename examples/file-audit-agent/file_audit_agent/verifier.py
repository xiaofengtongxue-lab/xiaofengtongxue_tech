from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from .tools import WorkspaceTools


REQUIRED_SECTIONS = ("## 文件概况", "## 需要关注", "## 建议下一步")


@dataclass(frozen=True)
class VerificationResult:
    passed: bool
    issues: tuple[str, ...]
    actual_file_count: int


def verify_report(tools: WorkspaceTools, draft_path: Path) -> VerificationResult:
    issues: list[str] = []
    files = tools.visible_files()

    if not draft_path.is_file():
        return VerificationResult(False, ("报告草稿不存在",), len(files))

    content = draft_path.read_text(encoding="utf-8")
    h1_count = len(re.findall(r"(?m)^# [^#].+$", content))
    if h1_count != 1:
        issues.append(f"报告应有且仅有一个 H1，当前为 {h1_count} 个")

    for section in REQUIRED_SECTIONS:
        if section not in content:
            issues.append(f"缺少章节：{section}")

    count_match = re.search(r"文件总数[：:]\s*(\d+)", content)
    if not count_match:
        issues.append("没有写出“文件总数：N”")
    elif int(count_match.group(1)) != len(files):
        issues.append(
            f"文件总数与真实目录不一致：报告写 {count_match.group(1)}，实际为 {len(files)}"
        )

    evidence_paths = set(re.findall(r"`([^`\n]+)`", content))
    valid_evidence = 0
    for value in sorted(evidence_paths):
        if value.startswith(("TODO", "FIXME")) or " " in value and "/" not in value:
            continue
        candidate = Path(value)
        if candidate.is_absolute() or ".." in candidate.parts:
            issues.append(f"证据路径不安全：{value}")
            continue
        resolved = tools.root / candidate
        if resolved.is_file() and resolved.resolve().is_relative_to(tools.root):
            valid_evidence += 1
        elif candidate.suffix:
            issues.append(f"报告引用了不存在的文件：{value}")

    if files and valid_evidence == 0:
        issues.append("报告没有引用任何真实文件路径作为证据")

    return VerificationResult(not issues, tuple(issues), len(files))
