from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from math import isfinite

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.device import Device, DeviceStatus
from app.models.product_model import ProductModel
from app.models.purchase_order import PurchaseOrder, PurchaseOrderStatus
from app.models.return_request import ReturnRequest
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.models.supplier import Supplier
from app.schemas.copilot import (
    CopilotItem,
    CopilotOverview,
    CopilotProductSnippet,
    CopilotSalesTrend,
    CopilotSeverity,
    CopilotSupplierSnippet,
)
from app.services import analytics_service as analytics_svc

AVAILABLE_STOCK_STATUSES = (DeviceStatus.available, DeviceStatus.in_stock)
OPEN_SALES_STATUSES = (
    SalesOrderStatus.draft,
    SalesOrderStatus.confirmed,
    SalesOrderStatus.packed,
    SalesOrderStatus.shipped,
)
PENDING_PO_STATUSES = (
    PurchaseOrderStatus.draft,
    PurchaseOrderStatus.ordered,
    PurchaseOrderStatus.partially_received,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _pct_change(current: int, previous: int) -> float | None:
    if previous <= 0:
        return None
    return (current - previous) / previous * 100.0


def _fmt_pct(pct: float | None) -> str:
    if pct is None or not isfinite(pct):
        return "—"
    rounded = round(pct, 1)
    sign = "+" if rounded > 0 else ""
    return f"{sign}{rounded}%"


@dataclass(frozen=True)
class _Window:
    start: datetime
    end: datetime


def _window_days(*, end: datetime, days: int) -> _Window:
    return _Window(start=end - timedelta(days=days), end=end)


def _count_sold_units_between(db: Session, start: datetime, end: datetime) -> int:
    stmt = (
        select(func.count(SalesOrderItem.id))
        .select_from(SalesOrderItem)
        .join(SalesOrder, SalesOrder.id == SalesOrderItem.sales_order_id)
        .where(
            and_(
                SalesOrder.created_at >= start,
                SalesOrder.created_at < end,
                SalesOrder.status != SalesOrderStatus.cancelled,
            )
        )
    )
    return int(db.scalar(stmt) or 0)


def _best_sellers(db: Session, *, start: datetime, end: datetime, limit: int = 5) -> list[CopilotProductSnippet]:
    stmt = (
        select(
            ProductModel.id,
            ProductModel.brand,
            ProductModel.model_name,
            ProductModel.storage,
            ProductModel.color,
            func.count(SalesOrderItem.id).label("units"),
        )
        .select_from(SalesOrderItem)
        .join(SalesOrder, SalesOrder.id == SalesOrderItem.sales_order_id)
        .join(Device, Device.id == SalesOrderItem.device_id)
        .join(ProductModel, ProductModel.id == Device.product_model_id)
        .where(
            and_(
                SalesOrder.created_at >= start,
                SalesOrder.created_at < end,
                SalesOrder.status != SalesOrderStatus.cancelled,
            )
        )
        .group_by(
            ProductModel.id,
            ProductModel.brand,
            ProductModel.model_name,
            ProductModel.storage,
            ProductModel.color,
        )
        .order_by(func.count(SalesOrderItem.id).desc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    out: list[CopilotProductSnippet] = []
    for r in rows:
        label = f"{r.brand} {r.model_name} · {r.storage} · {r.color}"
        out.append(CopilotProductSnippet(product_model_id=int(r.id), label=label, units=int(r.units)))
    return out


def _slow_movers(
    db: Session,
    *,
    as_of: datetime,
    no_sales_days: int,
    min_on_hand: int,
    limit: int = 5,
) -> list[CopilotProductSnippet]:
    cutoff = as_of - timedelta(days=no_sales_days)
    sold_recent = (
        select(Device.product_model_id)
        .select_from(SalesOrderItem)
        .join(SalesOrder, SalesOrder.id == SalesOrderItem.sales_order_id)
        .join(Device, Device.id == SalesOrderItem.device_id)
        .where(
            and_(
                SalesOrder.created_at >= cutoff,
                SalesOrder.status != SalesOrderStatus.cancelled,
                Device.product_model_id.is_not(None),
            )
        )
        .distinct()
    )

    cnt = func.count(Device.id).label("units")
    stmt = (
        select(
            ProductModel.id,
            ProductModel.brand,
            ProductModel.model_name,
            ProductModel.storage,
            ProductModel.color,
            cnt,
        )
        .select_from(ProductModel)
        .outerjoin(
            Device,
            and_(
                Device.product_model_id == ProductModel.id,
                Device.status.in_(AVAILABLE_STOCK_STATUSES),
            ),
        )
        .where(~ProductModel.id.in_(sold_recent))
        .group_by(
            ProductModel.id,
            ProductModel.brand,
            ProductModel.model_name,
            ProductModel.storage,
            ProductModel.color,
        )
        .having(cnt >= min_on_hand)
        .order_by(cnt.desc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    out: list[CopilotProductSnippet] = []
    for r in rows:
        label = f"{r.brand} {r.model_name} · {r.storage} · {r.color}"
        out.append(CopilotProductSnippet(product_model_id=int(r.id), label=label, units=int(r.units)))
    return out


def _supplier_activity(db: Session, *, start: datetime, end: datetime, limit: int = 5) -> list[CopilotSupplierSnippet]:
    stmt = (
        select(Supplier.id, Supplier.name, func.count(PurchaseOrder.id).label("po_count"))
        .select_from(Supplier)
        .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .where(and_(PurchaseOrder.created_at >= start, PurchaseOrder.created_at < end))
        .group_by(Supplier.id, Supplier.name)
        .order_by(func.count(PurchaseOrder.id).desc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [
        CopilotSupplierSnippet(supplier_id=int(r.id), name=str(r.name), purchase_orders_30d=int(r.po_count))
        for r in rows
    ]


def _returns_rate(db: Session, *, start: datetime, end: datetime) -> tuple[int, int, float | None]:
    sold = _count_sold_units_between(db, start, end)
    rr_stmt = select(func.count(ReturnRequest.id)).where(
        and_(ReturnRequest.created_at >= start, ReturnRequest.created_at < end)
    )
    returns = int(db.scalar(rr_stmt) or 0)
    rate = (returns / sold) if sold > 0 else None
    return sold, returns, rate


def _inactive_available_inventory(db: Session, *, stale_days: int, as_of: datetime) -> int:
    cutoff = as_of - timedelta(days=stale_days)
    stmt = select(func.count(Device.id)).where(
        and_(
            Device.status == DeviceStatus.available,
            Device.updated_at < cutoff,
        )
    )
    return int(db.scalar(stmt) or 0)


def get_copilot_overview(
    db: Session,
    *,
    low_stock_threshold: int = 5,
    trend_days: int = 7,
    slow_mover_days: int = 60,
    slow_mover_min_on_hand: int = 3,
    inactive_days: int = 30,
    return_rate_warn: float = 0.08,
    return_rate_danger: float = 0.15,
) -> CopilotOverview:
    now = _utcnow()

    dashboard = analytics_svc.get_dashboard(db, low_stock_threshold=low_stock_threshold, recent_limit=10)
    low_stock_count = len(dashboard.low_stock.rows)

    current = _window_days(end=now, days=trend_days)
    previous = _window_days(end=current.start, days=trend_days)
    cur_units = _count_sold_units_between(db, current.start, current.end)
    prev_units = _count_sold_units_between(db, previous.start, previous.end)
    pct = _pct_change(cur_units, prev_units)
    sales_trend = CopilotSalesTrend(
        window_days=trend_days,
        current_units=cur_units,
        previous_units=prev_units,
        change_pct=pct,
    )

    sold_30, returns_30, rate_30 = _returns_rate(db, start=now - timedelta(days=30), end=now)
    sold_30_prev, returns_30_prev, rate_30_prev = _returns_rate(
        db, start=now - timedelta(days=60), end=now - timedelta(days=30)
    )

    pending_sales = int(db.scalar(select(func.count(SalesOrder.id)).where(SalesOrder.status.in_(OPEN_SALES_STATUSES))) or 0)

    pending_po = int(db.scalar(select(func.count(PurchaseOrder.id)).where(PurchaseOrder.status.in_(PENDING_PO_STATUSES))) or 0)

    stale_available = _inactive_available_inventory(db, stale_days=inactive_days, as_of=now)

    best_sellers = _best_sellers(db, start=now - timedelta(days=30), end=now, limit=5)
    slow_movers = _slow_movers(
        db,
        as_of=now,
        no_sales_days=slow_mover_days,
        min_on_hand=slow_mover_min_on_hand,
        limit=5,
    )
    supplier_activity = _supplier_activity(db, start=now - timedelta(days=30), end=now, limit=5)

    alerts: list[CopilotItem] = []
    if low_stock_count > 0:
        alerts.append(
            CopilotItem(
                id="low-stock",
                title="Low stock models detected",
                detail=f"{low_stock_count} product models are at or below {low_stock_threshold} sellable units.",
                severity=CopilotSeverity.warning,
                metric=str(low_stock_count),
                action_label="Review inventory",
                action_path="/inventory",
            )
        )

    if rate_30 is not None and sold_30 > 0:
        sev = CopilotSeverity.info
        if rate_30 >= return_rate_danger:
            sev = CopilotSeverity.danger
        elif rate_30 >= return_rate_warn:
            sev = CopilotSeverity.warning
        alerts.append(
            CopilotItem(
                id="returns-rate-30d",
                title="Return rate (last 30 days)",
                detail=f"{returns_30} returns on {sold_30} units sold ({rate_30 * 100:.1f}%).",
                severity=sev,
                metric=f"{rate_30 * 100:.1f}%",
                action_label="Open returns",
                action_path="/returns",
            )
        )

    if pending_sales > 0:
        alerts.append(
            CopilotItem(
                id="pending-sales",
                title="Orders still in-flight",
                detail=f"{pending_sales} sales orders are not yet delivered (draft → shipped).",
                severity=CopilotSeverity.info,
                metric=str(pending_sales),
                action_label="Sales orders",
                action_path="/sales-orders",
            )
        )

    if pending_po > 0:
        alerts.append(
            CopilotItem(
                id="pending-pos",
                title="Purchase orders awaiting completion",
                detail=f"{pending_po} purchase orders are not fully received yet.",
                severity=CopilotSeverity.info,
                metric=str(pending_po),
                action_label="Purchase orders",
                action_path="/purchase-orders",
            )
        )

    if stale_available > 0:
        alerts.append(
            CopilotItem(
                id="stale-available",
                title="Stale available inventory",
                detail=f"{stale_available} devices are still marked available and haven’t been touched recently.",
                severity=CopilotSeverity.warning,
                metric=str(stale_available),
                action_label="Browse inventory",
                action_path="/inventory",
            )
        )

    insights: list[CopilotItem] = []
    insights.append(
        CopilotItem(
            id="sales-velocity",
            title=f"Sales velocity ({trend_days}d vs prior {trend_days}d)",
            detail=f"{cur_units} units sold recently vs {prev_units} in the prior window ({_fmt_pct(pct)}).",
            severity=CopilotSeverity.info,
            metric=_fmt_pct(pct),
            action_label="Recent sales",
            action_path="/sales-orders",
        )
    )

    if best_sellers:
        top = best_sellers[0]
        insights.append(
            CopilotItem(
                id="top-sku",
                title="Top seller (30d)",
                detail=f"{top.label} — {top.units} units.",
                severity=CopilotSeverity.info,
                metric=str(top.units),
                action_label="Inventory",
                action_path="/inventory",
            )
        )

    if supplier_activity:
        top_sup = supplier_activity[0]
        insights.append(
            CopilotItem(
                id="supplier-activity",
                title="Most active supplier (30d)",
                detail=f"{top_sup.name} — {top_sup.purchase_orders_30d} POs created.",
                severity=CopilotSeverity.info,
                metric=str(top_sup.purchase_orders_30d),
                action_label="Suppliers",
                action_path="/suppliers",
            )
        )

    if rate_30_prev is not None and rate_30 is not None and sold_30 > 0 and sold_30_prev > 0:
        delta = (rate_30 - rate_30_prev) * 100.0
        insights.append(
            CopilotItem(
                id="returns-trend",
                title="Returns vs last month",
                detail=f"Return rate moved from {rate_30_prev * 100:.1f}% to {rate_30 * 100:.1f}% (pts: {delta:+.1f}).",
                severity=CopilotSeverity.warning if delta > 1.0 else CopilotSeverity.info,
                metric=f"{rate_30 * 100:.1f}%",
                action_label="Returns",
                action_path="/returns",
            )
        )

    suggestions: list[CopilotItem] = []

    if low_stock_count > 0 and best_sellers:
        suggestions.append(
            CopilotItem(
                id="reorder-hot-skus",
                title="Reorder candidates",
                detail="Prioritize PO coverage for models that are low on hand and still selling.",
                severity=CopilotSeverity.info,
                action_label="Create PO",
                action_path="/purchase-orders/new",
            )
        )

    if slow_movers:
        suggestions.append(
            CopilotItem(
                id="liquidate-slow",
                title="Liquidate slow movers",
                detail="Consider promos or bundle pricing on SKUs with on-hand stock but no recent sales.",
                severity=CopilotSeverity.warning,
                action_label="Review models",
                action_path="/inventory",
            )
        )

    if rate_30 is not None and rate_30 >= return_rate_warn:
        suggestions.append(
            CopilotItem(
                id="qc-returns",
                title="Tighten intake QA",
                detail="Elevated returns often trace to condition mismatches—spot-check grading for top return reasons.",
                severity=CopilotSeverity.warning,
                action_label="Returns",
                action_path="/returns",
            )
        )

    if stale_available > 0:
        suggestions.append(
            CopilotItem(
                id="audit-stale-available",
                title="Audit stale availability",
                detail="Available devices with no recent updates may need status checks or repricing.",
                severity=CopilotSeverity.info,
                action_label="Inventory",
                action_path="/inventory",
            )
        )

    summary_parts: list[str] = []
    summary_parts.append(
        f"Sales moved {_fmt_pct(pct)} over the last {trend_days} days vs the prior {trend_days} days ({cur_units} vs {prev_units} units)."
    )
    if low_stock_count:
        summary_parts.append(f"{low_stock_count} models are low on sellable stock (≤{low_stock_threshold}).")
    if rate_30 is not None and sold_30 > 0:
        summary_parts.append(f"Return rate is {rate_30 * 100:.1f}% over the last 30 days on {sold_30} sold units.")
    if pending_sales or pending_po:
        summary_parts.append(f"Fulfillment backlog: {pending_sales} sales orders in-flight, {pending_po} POs not fully received.")

    summary = " ".join(summary_parts).strip()

    return CopilotOverview(
        generated_at=now,
        summary=summary,
        alerts=alerts,
        insights=insights,
        suggestions=suggestions,
        best_sellers=best_sellers,
        slow_movers=slow_movers,
        supplier_activity=supplier_activity,
        sales_trend=sales_trend,
    )
