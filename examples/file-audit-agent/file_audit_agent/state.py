from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


@dataclass
class ToolEvent:
    step: int
    name: str
    arguments_summary: dict[str, Any]
    ok: bool
    error_code: str | None = None


@dataclass
class RunState:
    goal: str
    run_id: str = field(default_factory=lambda: uuid4().hex[:12])
    status: str = "running"
    next_step: int = 0
    input_items: list[dict[str, Any]] = field(default_factory=list)
    tool_events: list[ToolEvent] = field(default_factory=list)
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CheckpointStore:
    def __init__(self, agent_dir: Path) -> None:
        self.directory = agent_dir / "checkpoints"

    def save(self, state: RunState) -> Path:
        self.directory.mkdir(parents=True, exist_ok=True)
        state.updated_at = datetime.now(timezone.utc).isoformat()
        target = self.directory / f"{state.run_id}.json"
        temporary = target.with_suffix(".tmp")
        payload = asdict(state)
        temporary.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temporary.replace(target)
        return target

    def load(self, run_id: str) -> RunState:
        target = self.directory / f"{run_id}.json"
        payload = json.loads(target.read_text(encoding="utf-8"))
        payload["tool_events"] = [ToolEvent(**item) for item in payload["tool_events"]]
        return RunState(**payload)
