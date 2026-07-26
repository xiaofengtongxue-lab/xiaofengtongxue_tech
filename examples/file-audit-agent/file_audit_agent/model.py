from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class ToolCall:
    call_id: str
    name: str
    arguments: str


@dataclass(frozen=True)
class ModelTurn:
    items: list[dict[str, Any]]
    tool_calls: list[ToolCall]
    output_text: str
    response_id: str | None = None


class AgentModel(Protocol):
    def complete(
        self,
        *,
        instructions: str,
        tools: list[dict[str, Any]],
        input_items: list[dict[str, Any]],
    ) -> ModelTurn: ...


class OpenAIResponsesModel:
    def __init__(self, model: str) -> None:
        from openai import OpenAI

        self._client = OpenAI()
        self._model = model

    def complete(
        self,
        *,
        instructions: str,
        tools: list[dict[str, Any]],
        input_items: list[dict[str, Any]],
    ) -> ModelTurn:
        response = self._client.responses.create(
            model=self._model,
            instructions=instructions,
            tools=tools,
            input=input_items,
            store=False,
        )

        items = [item.model_dump(exclude_none=True) for item in response.output]
        calls = [
            ToolCall(
                call_id=item.call_id,
                name=item.name,
                arguments=item.arguments,
            )
            for item in response.output
            if item.type == "function_call"
        ]
        return ModelTurn(
            items=items,
            tool_calls=calls,
            output_text=response.output_text,
            response_id=response.id,
        )
