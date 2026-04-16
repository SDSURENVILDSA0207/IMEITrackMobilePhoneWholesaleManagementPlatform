from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse, AssistantPromptResponse
from app.services import assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.get("/prompts", response_model=AssistantPromptResponse)
def get_prompts(current_user: User = Depends(get_current_user)) -> AssistantPromptResponse:
    prompts = assistant_service.get_prompts_for_user(current_user)
    return AssistantPromptResponse(prompts=prompts)


@router.post("/chat", response_model=AssistantChatResponse)
def chat(
    payload: AssistantChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssistantChatResponse:
    return assistant_service.respond_to_message(
        db=db,
        user=current_user,
        message=payload.message,
        context_route=payload.context_route,
    )
