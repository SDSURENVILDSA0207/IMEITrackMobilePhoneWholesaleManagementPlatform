from typing import Literal

from pydantic import BaseModel, Field


class AssistantMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class AssistantAction(BaseModel):
    label: str
    path: str


class AssistantNavigateAction(BaseModel):
    """Primary client-side action (e.g. in-app navigation). Extensible with new `type` values later."""

    type: Literal["navigate"] = "navigate"
    target: str = Field(..., max_length=256, description="App path, e.g. /purchase-orders")
    query: dict[str, str] = Field(default_factory=dict, description="Optional query string pairs for the client")
    context: str | None = Field(
        default=None,
        max_length=64,
        description="Semantic slug mirroring page context (e.g. low_stock, recent_sales, imei_search); optional",
    )


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[AssistantMessage] = Field(default_factory=list, max_length=16)
    context_route: str | None = Field(default=None, max_length=200)


class AssistantChatResponse(BaseModel):
    answer: str
    grounded: bool = True
    intent: str | None = Field(
        default=None,
        description="High-level intent: navigation, data_question, mixed, summary, search, suggestion, help",
    )
    action: AssistantNavigateAction | None = Field(
        default=None,
        description="Primary action for the client to execute (e.g. auto-navigate)",
    )
    actions: list[AssistantAction] = Field(default_factory=list)
    suggested_prompts: list[str] = Field(default_factory=list)


class AssistantPromptResponse(BaseModel):
    prompts: list[str]
