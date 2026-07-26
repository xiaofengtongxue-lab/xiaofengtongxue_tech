from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from .config import Settings


TEXT_SUFFIXES = {
    ".csv",
    ".json",
    ".md",
    ".py",
    ".txt",
    ".yaml",
    ".yml",
}


class ToolError(ValueError):
    pass


@dataclass(frozen=True)
class RegisteredTool:
    schema: dict[str, Any]
    handler: Callable[..., dict[str, Any]]


class WorkspaceTools:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.root = settings.root.expanduser().resolve()
        if not self.root.is_dir():
            raise ToolError(f"工作目录不存在：{self.root}")

        self._registry = {
            "list_files": RegisteredTool(self._list_files_schema(), self.list_files),
            "read_text_file": RegisteredTool(self._read_text_schema(), self.read_text_file),
            "search_text": RegisteredTool(self._search_text_schema(), self.search_text),
            "save_report_draft": RegisteredTool(self._save_draft_schema(), self.save_report_draft),
        }

    @property
    def schemas(self) -> list[dict[str, Any]]:
        return [tool.schema for tool in self._registry.values()]

    def dispatch(self, name: str, arguments_json: str) -> dict[str, Any]:
        tool = self._registry.get(name)
        if tool is None:
            return {"ok": False, "error_code": "unknown_tool", "message": f"未知工具：{name}"}

        try:
            arguments = json.loads(arguments_json)
            if not isinstance(arguments, dict):
                raise ToolError("工具参数必须是 JSON 对象")
            result = tool.handler(**arguments)
            return {"ok": True, "data": result}
        except (json.JSONDecodeError, TypeError, ToolError) as exc:
            return {
                "ok": False,
                "error_code": "invalid_tool_call",
                "message": str(exc),
                "retryable": False,
            }
        except OSError as exc:
            return {
                "ok": False,
                "error_code": "io_error",
                "message": f"文件操作失败：{exc.strerror or type(exc).__name__}",
                "retryable": True,
            }

    def list_files(self, relative_dir: str = ".") -> dict[str, Any]:
        directory = self._resolve(relative_dir)
        if not directory.is_dir():
            raise ToolError(f"不是目录：{relative_dir}")

        files = []
        for path in sorted(directory.rglob("*")):
            if not path.is_file() or self._is_internal(path):
                continue
            if path.is_symlink():
                continue
            files.append(
                {
                    "path": path.relative_to(self.root).as_posix(),
                    "bytes": path.stat().st_size,
                    "type": path.suffix.lower() or "(no suffix)",
                }
            )
            if len(files) >= self.settings.max_files:
                break

        return {
            "directory": self._display_path(directory),
            "files": files,
            "returned": len(files),
            "limit": self.settings.max_files,
        }

    def read_text_file(self, path: str) -> dict[str, Any]:
        target = self._resolve(path)
        if not target.is_file():
            raise ToolError(f"文件不存在：{path}")
        if target.suffix.lower() not in TEXT_SUFFIXES:
            raise ToolError(f"本教程只允许读取这些文本类型：{sorted(TEXT_SUFFIXES)}")

        content = target.read_text(encoding="utf-8")
        clipped = len(content) > self.settings.max_read_chars
        if clipped:
            content = content[: self.settings.max_read_chars]

        return {
            "path": target.relative_to(self.root).as_posix(),
            "content": content,
            "truncated": clipped,
            "max_chars": self.settings.max_read_chars,
        }

    def search_text(self, query: str, relative_dir: str = ".") -> dict[str, Any]:
        if not query.strip():
            raise ToolError("搜索词不能为空")

        directory = self._resolve(relative_dir)
        if not directory.is_dir():
            raise ToolError(f"不是目录：{relative_dir}")

        matches = []
        needle = query.casefold()
        for path in sorted(directory.rglob("*")):
            if (
                not path.is_file()
                or path.is_symlink()
                or self._is_internal(path)
                or path.suffix.lower() not in TEXT_SUFFIXES
            ):
                continue
            try:
                lines = path.read_text(encoding="utf-8").splitlines()
            except UnicodeDecodeError:
                continue
            for line_number, line in enumerate(lines, start=1):
                if needle in line.casefold():
                    matches.append(
                        {
                            "path": path.relative_to(self.root).as_posix(),
                            "line": line_number,
                            "text": line[:240],
                        }
                    )
                    if len(matches) >= 30:
                        return {"query": query, "matches": matches, "truncated": True}

        return {"query": query, "matches": matches, "truncated": False}

    def save_report_draft(self, content: str) -> dict[str, Any]:
        if not content.strip():
            raise ToolError("报告内容不能为空")
        if len(content) > 50_000:
            raise ToolError("报告草稿不能超过 50000 个字符")

        target = self.settings.draft_path
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix(".tmp")
        temporary.write_text(content, encoding="utf-8")
        temporary.replace(target)
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        return {
            "draft_path": target.relative_to(self.root).as_posix(),
            "sha256": digest,
            "characters": len(content),
            "published": False,
        }

    def visible_files(self) -> list[Path]:
        return [
            path
            for path in sorted(self.root.rglob("*"))
            if path.is_file() and not path.is_symlink() and not self._is_internal(path)
        ]

    def _resolve(self, relative_path: str) -> Path:
        requested = Path(relative_path)
        if requested.is_absolute():
            raise ToolError("只允许使用工作目录内的相对路径")

        current = self.root
        for part in requested.parts:
            if part in {"", "."}:
                continue
            current = current / part
            if current.is_symlink():
                raise ToolError("不允许通过符号链接访问文件")

        resolved = (self.root / requested).resolve(strict=False)
        if not resolved.is_relative_to(self.root):
            raise ToolError("路径越过了工作目录边界")
        return resolved

    def _is_internal(self, path: Path) -> bool:
        relative = path.relative_to(self.root)
        return relative.parts[0] in {".agent", "reports"}

    def _display_path(self, path: Path) -> str:
        relative = path.relative_to(self.root)
        return relative.as_posix() if relative.parts else "."

    @staticmethod
    def _list_files_schema() -> dict[str, Any]:
        return {
            "type": "function",
            "name": "list_files",
            "description": "列出工作目录内的文件、大小和类型。开始盘点时优先调用。不能读取工作目录之外的路径。",
            "parameters": {
                "type": "object",
                "properties": {
                    "relative_dir": {
                        "type": "string",
                        "description": "工作目录内的相对目录，例如 . 或 notes",
                    }
                },
                "required": ["relative_dir"],
                "additionalProperties": False,
            },
            "strict": True,
        }

    @staticmethod
    def _read_text_schema() -> dict[str, Any]:
        return {
            "type": "function",
            "name": "read_text_file",
            "description": "读取一个已由 list_files 发现的 UTF-8 文本文件。不要猜路径，不支持二进制文件。",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "工作目录内的相对文件路径"}
                },
                "required": ["path"],
                "additionalProperties": False,
            },
            "strict": True,
        }

    @staticmethod
    def _search_text_schema() -> dict[str, Any]:
        return {
            "type": "function",
            "name": "search_text",
            "description": "在工作目录的文本文件中搜索确定的关键词，返回真实路径、行号和片段。适合查 TODO、FIXME 或用户指定词语。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "要搜索的原始关键词"},
                    "relative_dir": {"type": "string", "description": "搜索范围内的相对目录"},
                },
                "required": ["query", "relative_dir"],
                "additionalProperties": False,
            },
            "strict": True,
        }

    @staticmethod
    def _save_draft_schema() -> dict[str, Any]:
        return {
            "type": "function",
            "name": "save_report_draft",
            "description": (
                "把盘点结果保存到受限草稿区，不会覆盖原资料，也不会直接发布。"
                "报告必须包含唯一 H1、文件总数：N、## 文件概况、## 需要关注、## 建议下一步，"
                "并用反引号标出作为证据的真实相对路径。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {"type": "string", "description": "完整 Markdown 报告草稿"}
                },
                "required": ["content"],
                "additionalProperties": False,
            },
            "strict": True,
        }
