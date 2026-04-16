from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.analytics import (
    ConditionGradeCount,
    DashboardAnalytics,
    KpiCounts,
    LowStockSummary,
    RecentPurchaseOrderRow,
    RecentSalesOrderRow,
    ReturnStatusCount,
)
from app.services import analytics_service as analytics_svc

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/kpis", response_model=KpiCounts)
def get_kpis(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> KpiCounts:
    """Totals: suppliers, customers, available / sold / reserved devices."""
    return analytics_svc.get_kpi_counts(db)


@router.get("/low-stock", response_model=LowStockSummary)
def get_low_stock(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    threshold: int = Query(default=5, ge=0, le=10_000),
    limit: int = Query(default=50, ge=1, le=500),
) -> LowStockSummary:
    """Product models at or below available/in_stock unit threshold."""
    return analytics_svc.get_low_stock_by_product_model(db, threshold=threshold, limit=limit)


@router.get("/recent/purchase-orders", response_model=list[RecentPurchaseOrderRow])
def get_recent_purchase_orders(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    limit: int = Query(default=10, ge=1, le=100),
) -> list[RecentPurchaseOrderRow]:
    return analytics_svc.get_recent_purchase_orders(db, limit=limit)


@router.get("/recent/sales-orders", response_model=list[RecentSalesOrderRow])
def get_recent_sales_orders(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    limit: int = Query(default=10, ge=1, le=100),
) -> list[RecentSalesOrderRow]:
    return analytics_svc.get_recent_sales_orders(db, limit=limit)


@router.get("/returns/summary", response_model=list[ReturnStatusCount])
def get_returns_summary(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[ReturnStatusCount]:
    return analytics_svc.get_return_summary_by_status(db)


@router.get("/inventory/by-condition-grade", response_model=list[ConditionGradeCount])
def get_inventory_by_condition(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[ConditionGradeCount]:
    return analytics_svc.get_inventory_count_by_condition_grade(db)


@router.get("/dashboard", response_model=DashboardAnalytics)
def get_dashboard(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    low_stock_threshold: int = Query(default=5, ge=0),
    recent_limit: int = Query(default=10, ge=1, le=50),
) -> DashboardAnalytics:
    """Single payload for dashboard cards and charts."""
    return analytics_svc.get_dashboard(
        db,
        low_stock_threshold=low_stock_threshold,
        recent_limit=recent_limit,
    )
