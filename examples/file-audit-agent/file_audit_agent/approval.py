from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ApprovalRequest:
    token: str
    draft_sha256: str
    confirmation_text: str


def make_approval_request(draft_path: Path, token: str) -> ApprovalRequest:
    digest = hashlib.sha256(draft_path.read_bytes()).hexdigest()
    return ApprovalRequest(
        token=token,
        draft_sha256=digest,
        confirmation_text=f"APPROVE {token}",
    )


def publish_report(
    *,
    draft_path: Path,
    report_path: Path,
    request: ApprovalRequest,
    confirmation: str,
) -> Path:
    if confirmation.strip() != request.confirmation_text:
        raise PermissionError("确认文字不匹配，报告没有发布")

    current_digest = hashlib.sha256(draft_path.read_bytes()).hexdigest()
    if current_digest != request.draft_sha256:
        raise PermissionError("草稿在确认后发生变化，需要重新检查并确认")

    report_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = report_path.with_suffix(".tmp")
    temporary.write_bytes(draft_path.read_bytes())
    temporary.replace(report_path)
    return report_path
