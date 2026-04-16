from pydantic import BaseModel, Field


class AssistantMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class AssistantAction(BaseModel):
    label: str
    path: str


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[AssistantMessage] = Field(default_factory=list, max_length=16)
    context_route: str | None = Field(default=None, max_length=200)


class AssistantChatResponse(BaseModel):
    answer: str
    grounded: bool = True
    actions: list[AssistantAction] = Field(default_factory=list)
    suggested_prompts: list[str] = Field(default_factory=list)


class AssistantPromptResponse(BaseModel):
    prompts: list[str]
