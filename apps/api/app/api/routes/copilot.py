from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.copilot import CopilotItem, CopilotOverview
from app.services import copilot_service as copilot_svc

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/overview", response_model=CopilotOverview)
def get_copilot_overview(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    low_stock_threshold: int = Query(default=5, ge=0, le=10_000),
    trend_days: int = Query(default=7, ge=1, le=90),
    slow_mover_days: int = Query(default=60, ge=7, le=365),
    slow_mover_min_on_hand: int = Query(default=3, ge=1, le=10_000),
    inactive_days: int = Query(default=30, ge=1, le=365),
) -> CopilotOverview:
    """Rule-based operations insights for the dashboard Copilot panel."""
    return copilot_svc.get_copilot_overview(
        db,
        low_stock_threshold=low_stock_threshold,
        trend_days=trend_days,
        slow_mover_days=slow_mover_days,
        slow_mover_min_on_hand=slow_mover_min_on_hand,
        inactive_days=inactive_days,
    )


@router.get("/alerts", response_model=list[CopilotItem])
def get_copilot_alerts(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    low_stock_threshold: int = Query(default=5, ge=0, le=10_000),
    trend_days: int = Query(default=7, ge=1, le=90),
    slow_mover_days: int = Query(default=60, ge=7, le=365),
    slow_mover_min_on_hand: int = Query(default=3, ge=1, le=10_000),
    inactive_days: int = Query(default=30, ge=1, le=365),
) -> list[CopilotItem]:
    return copilot_svc.get_copilot_overview(
        db,
        low_stock_threshold=low_stock_threshold,
        trend_days=trend_days,
        slow_mover_days=slow_mover_days,
        slow_mover_min_on_hand=slow_mover_min_on_hand,
        inactive_days=inactive_days,
    ).alerts


@router.get("/insights", response_model=list[CopilotItem])
def get_copilot_insights(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    low_stock_threshold: int = Query(default=5, ge=0, le=10_000),
    trend_days: int = Query(default=7, ge=1, le=90),
    slow_mover_days: int = Query(default=60, ge=7, le=365),
    slow_mover_min_on_hand: int = Query(default=3, ge=1, le=10_000),
    inactive_days: int = Query(default=30, ge=1, le=365),
) -> list[CopilotItem]:
    return copilot_svc.get_copilot_overview(
        db,
        low_stock_threshold=low_stock_threshold,
        trend_days=trend_days,
        slow_mover_days=slow_mover_days,
        slow_mover_min_on_hand=slow_mover_min_on_hand,
        inactive_days=inactive_days,
    ).insights


@router.get("/suggestions", response_model=list[CopilotItem])
def get_copilot_suggestions(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    low_stock_threshold: int = Query(default=5, ge=0, le=10_000),
    trend_days: int = Query(default=7, ge=1, le=90),
    slow_mover_days: int = Query(default=60, ge=7, le=365),
    slow_mover_min_on_hand: int = Query(default=3, ge=1, le=10_000),
    inactive_days: int = Query(default=30, ge=1, le=365),
) -> list[CopilotItem]:
    return copilot_svc.get_copilot_overview(
        db,
        low_stock_threshold=low_stock_threshold,
        trend_days=trend_days,
        slow_mover_days=slow_mover_days,
        slow_mover_min_on_hand=slow_mover_min_on_hand,
        inactive_days=inactive_days,
    ).suggestions
