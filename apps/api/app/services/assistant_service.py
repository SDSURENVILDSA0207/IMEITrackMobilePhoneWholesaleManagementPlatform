import re
from decimal import Decimal

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.device import Device, DeviceStatus
from app.models.purchase_order import PurchaseOrder
from app.models.return_request import ReturnRequest
from app.models.sales_order import SalesOrder
from app.models.supplier import Supplier
from app.models.user import User, UserRole
from app.schemas.assistant import AssistantAction, AssistantChatResponse
from app.services import analytics_service

IMEI_PATTERN = re.compile(r"\b\d{14,17}\b")


def _currency(value: Decimal | float | int | None) -> str:
    if value is None:
        return "$0.00"
    return f"${float(value):,.2f}"


def _default_prompts(role: UserRole) -> list[str]:
    prompts = [
        "What should I pay attention to today?",
        "Summarize return requests by status.",
        "Show recent sales orders.",
        "Show recent purchase orders.",
        "Do we have low-stock products right now?",
        "Find a device by IMEI 352099001761481.",
    ]
    if role == UserRole.inventory_manager:
        prompts.insert(1, "Summarize available vs reserved vs sold inventory.")
    if role == UserRole.sales_manager:
        prompts.insert(1, "Which customers have the highest outstanding balance?")
    return prompts[:6]


def _route_actions_for_summary() -> list[AssistantAction]:
    return [
        AssistantAction(label="Open dashboard", path="/"),
        AssistantAction(label="View inventory", path="/inventory"),
        AssistantAction(label="View returns", path="/returns"),
    ]


def _assistant_daily_summary(db: Session) -> AssistantChatResponse:
    kpis = analytics_service.get_kpi_counts(db)
    low = analytics_service.get_low_stock_by_product_model(db, threshold=5, limit=3)
    ret = analytics_service.get_return_summary_by_status(db)
    open_returns = sum(row.count for row in ret if row.status in {"requested", "approved"})
    low_stock_text = (
        "No low-stock items below 5 units."
        if not low.rows
        else "Low stock watchlist: " + ", ".join(f"{r.brand} {r.model_name} ({r.available_units})" for r in low.rows)
    )
    answer = (
        f"Here is the current operations pulse:\n"
        f"- Inventory: {kpis.total_available_devices} available, {kpis.total_reserved_devices} reserved, {kpis.total_sold_devices} sold.\n"
        f"- Commercial: {kpis.total_customers} customers and {kpis.total_suppliers} suppliers in master data.\n"
        f"- Returns: {open_returns} open return requests (requested + approved).\n"
        f"- {low_stock_text}"
    )
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=_route_actions_for_summary(),
        suggested_prompts=[
            "Show recent sales orders.",
            "Show recent purchase orders.",
            "Summarize return requests by status.",
        ],
    )


def _inventory_summary(db: Session) -> AssistantChatResponse:
    counts = dict(
        db.execute(select(Device.status, func.count(Device.id)).group_by(Device.status)).all()
    )
    low = analytics_service.get_low_stock_by_product_model(db, threshold=5, limit=5)
    answer = (
        "Inventory snapshot:\n"
        f"- Available: {int(counts.get(DeviceStatus.available, 0))}\n"
        f"- In stock: {int(counts.get(DeviceStatus.in_stock, 0))}\n"
        f"- Reserved: {int(counts.get(DeviceStatus.reserved, 0))}\n"
        f"- Sold: {int(counts.get(DeviceStatus.sold, 0))}\n"
        f"- Return requested: {int(counts.get(DeviceStatus.return_requested, 0))}\n"
        f"- Returned: {int(counts.get(DeviceStatus.returned, 0))}\n"
    )
    if low.rows:
        answer += "\nTop low-stock models: " + ", ".join(
            f"{row.brand} {row.model_name} ({row.available_units})" for row in low.rows
        )
    return AssistantChatResponse(
        answer=answer.strip(),
        grounded=True,
        actions=[AssistantAction(label="Open inventory", path="/inventory")],
        suggested_prompts=["Find a device by IMEI 352099001761481.", "Do we have low-stock products right now?"],
    )


def _returns_summary(db: Session) -> AssistantChatResponse:
    rows = analytics_service.get_return_summary_by_status(db)
    non_zero = [row for row in rows if row.count > 0]
    if not non_zero:
        answer = "There are currently no return requests across all statuses."
    else:
        answer = "Return request distribution:\n" + "\n".join(f"- {row.status}: {row.count}" for row in rows)
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=[AssistantAction(label="Open returns / RMA", path="/returns")],
        suggested_prompts=["What should I pay attention to today?", "Show recent sales orders."],
    )


def _recent_sales(db: Session) -> AssistantChatResponse:
    rows = analytics_service.get_recent_sales_orders(db, limit=5)
    if not rows:
        return AssistantChatResponse(
            answer="No sales orders found yet.",
            grounded=True,
            actions=[AssistantAction(label="Create sales order", path="/sales-orders/new")],
            suggested_prompts=["Show recent purchase orders.", "Summarize return requests by status."],
        )
    answer = "Recent sales orders:\n" + "\n".join(
        f"- {row.order_number} · {row.status} · {_currency(row.total_amount)}"
        for row in rows
    )
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=[AssistantAction(label="Open sales orders", path="/sales-orders")],
        suggested_prompts=["Which customers have the highest outstanding balance?", "Summarize return requests by status."],
    )


def _recent_purchase(db: Session) -> AssistantChatResponse:
    rows = analytics_service.get_recent_purchase_orders(db, limit=5)
    if not rows:
        return AssistantChatResponse(
            answer="No purchase orders found yet.",
            grounded=True,
            actions=[AssistantAction(label="Create purchase order", path="/purchase-orders/new")],
            suggested_prompts=["Show recent sales orders.", "Do we have low-stock products right now?"],
        )
    answer = "Recent purchase orders:\n" + "\n".join(
        f"- {row.po_number} · {row.status} · {_currency(row.total_amount)}"
        for row in rows
    )
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=[AssistantAction(label="Open purchase orders", path="/purchase-orders")],
        suggested_prompts=["Which suppliers are most active?", "Do we have low-stock products right now?"],
    )


def _supplier_activity(db: Session) -> AssistantChatResponse:
    stmt = (
        select(Supplier.name, func.count(PurchaseOrder.id).label("orders"))
        .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
        .group_by(Supplier.id, Supplier.name)
        .order_by(desc("orders"))
        .limit(5)
    )
    rows = db.execute(stmt).all()
    if not rows:
        answer = "No supplier activity found in purchase orders yet."
    else:
        answer = "Most active suppliers by purchase order volume:\n" + "\n".join(
            f"- {name}: {orders} purchase orders" for name, orders in rows
        )
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=[AssistantAction(label="Open suppliers", path="/suppliers")],
        suggested_prompts=["Show recent purchase orders.", "Do we have low-stock products right now?"],
    )


def _customer_balance_summary(db: Session) -> AssistantChatResponse:
    rows = db.execute(
        select(Customer.business_name, Customer.outstanding_balance)
        .order_by(desc(Customer.outstanding_balance))
        .limit(5)
    ).all()
    meaningful = [(name, bal) for name, bal in rows if bal and float(bal) > 0]
    if not meaningful:
        answer = "No customers currently have outstanding balances."
    else:
        answer = "Top customers by outstanding balance:\n" + "\n".join(
            f"- {name}: {_currency(balance)}" for name, balance in meaningful
        )
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=[AssistantAction(label="Open customers", path="/customers")],
        suggested_prompts=["Show recent sales orders.", "What should I pay attention to today?"],
    )


def _device_lookup(db: Session, imei: str) -> AssistantChatResponse:
    device = db.execute(
        select(Device)
        .options(joinedload(Device.product_model), joinedload(Device.source_batch))
        .where(Device.imei == imei)
        .limit(1)
    ).scalar_one_or_none()
    if not device:
        return AssistantChatResponse(
            answer=f"I could not find a device with IMEI `{imei}`.",
            grounded=True,
            actions=[AssistantAction(label="Open inventory", path="/inventory")],
            suggested_prompts=["Summarize available vs reserved vs sold inventory."],
        )

    model = (
        f"{device.product_model.brand} {device.product_model.model_name} {device.product_model.storage} {device.product_model.color}"
        if device.product_model
        else "Unknown model"
    )
    batch = device.source_batch.batch_code if device.source_batch else "No batch"
    answer = (
        f"Found device `{imei}`:\n"
        f"- Status: {device.status}\n"
        f"- Grade: {device.condition_grade}\n"
        f"- Battery: {device.battery_health}%\n"
        f"- Model: {model}\n"
        f"- Batch: {batch}"
    )
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=[AssistantAction(label="Open inventory", path="/inventory")],
        suggested_prompts=["Summarize available vs reserved vs sold inventory.", "Summarize return requests by status."],
    )


def _intent_from_message(message: str) -> str:
    text = message.lower().strip()
    if IMEI_PATTERN.search(text):
        return "imei_lookup"
    if any(k in text for k in ("pay attention", "today", "summary", "overview")):
        return "daily_summary"
    if "low stock" in text:
        return "low_stock"
    if "recent sales" in text or ("sales orders" in text and "recent" in text):
        return "recent_sales"
    if "recent purchase" in text or ("purchase orders" in text and "recent" in text):
        return "recent_purchase"
    if "return" in text and any(k in text for k in ("summary", "pattern", "status", "requests")):
        return "returns_summary"
    if "supplier" in text and any(k in text for k in ("active", "most", "top")):
        return "supplier_activity"
    if "inventory" in text:
        return "inventory_summary"
    if "customer" in text and any(k in text for k in ("outstanding", "balance", "top")):
        return "customer_balance"
    return "help"


def _help_response(user: User) -> AssistantChatResponse:
    prompts = _default_prompts(user.role)
    answer = (
        "I can help with grounded operations insights from IMEITrack data. "
        "Try asking about low stock, recent orders, returns, supplier activity, or specific IMEIs."
    )
    return AssistantChatResponse(
        answer=answer,
        grounded=True,
        actions=_route_actions_for_summary(),
        suggested_prompts=prompts,
    )


def get_prompts_for_user(user: User) -> list[str]:
    return _default_prompts(user.role)


def respond_to_message(*, db: Session, user: User, message: str, context_route: str | None = None) -> AssistantChatResponse:
    _ = context_route
    text = message.strip()
    intent = _intent_from_message(text)
    imei_match = IMEI_PATTERN.search(text)

    if intent == "imei_lookup" and imei_match:
        return _device_lookup(db, imei_match.group(0))
    if intent in {"daily_summary", "low_stock"}:
        return _assistant_daily_summary(db)
    if intent == "recent_sales":
        return _recent_sales(db)
    if intent == "recent_purchase":
        return _recent_purchase(db)
    if intent == "returns_summary":
        return _returns_summary(db)
    if intent == "supplier_activity":
        return _supplier_activity(db)
    if intent == "inventory_summary":
        return _inventory_summary(db)
    if intent == "customer_balance":
        return _customer_balance_summary(db)

    # Route-primed contextual fallback based on route.
    if context_route and context_route.startswith("/returns"):
        return _returns_summary(db)
    if context_route and context_route.startswith("/inventory"):
        return _inventory_summary(db)
    if context_route and context_route.startswith("/sales-orders"):
        return _recent_sales(db)
    if context_route and context_route.startswith("/purchase-orders"):
        return _recent_purchase(db)

    return _help_response(user)
