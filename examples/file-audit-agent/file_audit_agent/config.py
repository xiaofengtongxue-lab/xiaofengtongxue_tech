from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    root: Path
    model: str = "gpt-5.6-terra"
    max_steps: int = 10
    max_read_chars: int = 6_000
    max_files: int = 200
    max_tool_repeats: int = 3

    def __post_init__(self) -> None:
        object.__setattr__(self, "root", self.root.expanduser().resolve())

    @property
    def agent_dir(self) -> Path:
        return self.root / ".agent"

    @property
    def draft_path(self) -> Path:
        return self.agent_dir / "drafts" / "inventory.md"

    @property
    def report_path(self) -> Path:
        return self.root / "reports" / "inventory.md"
