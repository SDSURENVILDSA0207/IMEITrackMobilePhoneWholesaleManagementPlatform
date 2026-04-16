from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.device import Device, DeviceStatus
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.schemas.sales_order import SalesOrderCreate, SalesOrderItemAdd, SalesOrderStatusUpdate


ADD_DEVICE_ALLOWED_STATUSES = frozenset(
    {
        SalesOrderStatus.draft,
        SalesOrderStatus.confirmed,
        SalesOrderStatus.packed,
    }
)

CANCEL_BLOCKED_STATUSES = frozenset({SalesOrderStatus.shipped, SalesOrderStatus.delivered})


def _recalculate_total(db: Session, order_id: int) -> None:
    order = db.get(SalesOrder, order_id)
    if order is None:
        return
    total = (
        db.query(func.coalesce(func.sum(SalesOrderItem.selling_price), 0))
        .filter(SalesOrderItem.sales_order_id == order_id)
        .scalar()
    )
    order.total_amount = Decimal(str(total)) if total is not None else Decimal("0")
    db.add(order)
    db.commit()
    db.refresh(order)


def _sync_devices_with_order_status(db: Session, order: SalesOrder) -> None:
    items = (
        db.query(SalesOrderItem)
        .options(joinedload(SalesOrderItem.device))
        .filter(SalesOrderItem.sales_order_id == order.id)
        .all()
    )

    if order.status == SalesOrderStatus.cancelled:
        for item in items:
            dev = item.device
            if dev and dev.status == DeviceStatus.reserved:
                dev.status = DeviceStatus.available
                db.add(dev)
        db.commit()
        return

    if order.status in (SalesOrderStatus.shipped, SalesOrderStatus.delivered):
        for item in items:
            dev = item.device
            if dev and dev.status == DeviceStatus.reserved:
                dev.status = DeviceStatus.sold
                db.add(dev)
        db.commit()


def create_sales_order(db: Session, payload: SalesOrderCreate, created_by: int | None) -> SalesOrder:
    order = SalesOrder(
        customer_id=payload.customer_id,
        order_number=payload.order_number,
        status=payload.status,
        notes=payload.notes,
        created_by=created_by,
        total_amount=Decimal("0"),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def get_sales_order_by_id(db: Session, order_id: int) -> SalesOrder | None:
    return db.get(SalesOrder, order_id)


def list_sales_orders(
    db: Session,
    status: SalesOrderStatus | None = None,
    customer_id: int | None = None,
) -> list[SalesOrder]:
    q = db.query(SalesOrder).options(joinedload(SalesOrder.customer))
    if status is not None:
        q = q.filter(SalesOrder.status == status)
    if customer_id is not None:
        q = q.filter(SalesOrder.customer_id == customer_id)
    return q.order_by(SalesOrder.created_at.desc()).all()


def _validate_device_for_sale(db: Session, device_id: int) -> Device:
    device = db.get(Device, device_id)
    if device is None:
        raise ValueError("Device not found")
    if device.status not in (DeviceStatus.available, DeviceStatus.in_stock):
        raise ValueError("Device is not available for sale")
    existing = db.query(SalesOrderItem).filter(SalesOrderItem.device_id == device_id).first()
    if existing is not None:
        raise ValueError("Device is already assigned to a sales order")
    return device


def add_device_to_sales_order(db: Session, order_id: int, payload: SalesOrderItemAdd) -> SalesOrderItem:
    order = db.get(SalesOrder, order_id)
    if order is None:
        raise ValueError("Sales order not found")
    if order.status not in ADD_DEVICE_ALLOWED_STATUSES:
        raise ValueError("Cannot add devices to an order in the current status")

    device = _validate_device_for_sale(db, payload.device_id)

    item = SalesOrderItem(
        sales_order_id=order.id,
        device_id=payload.device_id,
        selling_price=payload.selling_price,
    )
    device.status = DeviceStatus.reserved
    db.add(item)
    db.add(device)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Device is already assigned to a sales order") from None

    db.refresh(item)
    _recalculate_total(db, order_id)
    return item


def bulk_add_devices_to_sales_order(db: Session, order_id: int, items: list[SalesOrderItemAdd]) -> list[SalesOrderItem]:
    order = db.get(SalesOrder, order_id)
    if order is None:
        raise ValueError("Sales order not found")
    if order.status not in ADD_DEVICE_ALLOWED_STATUSES:
        raise ValueError("Cannot add devices to an order in the current status")

    seen_devices: set[int] = set()
    created_rows: list[SalesOrderItem] = []
    for entry in items:
        if entry.device_id in seen_devices:
            raise ValueError("Duplicate device in bulk request")
        seen_devices.add(entry.device_id)
        device = _validate_device_for_sale(db, entry.device_id)
        item = SalesOrderItem(
            sales_order_id=order.id,
            device_id=entry.device_id,
            selling_price=entry.selling_price,
        )
        device.status = DeviceStatus.reserved
        db.add(item)
        db.add(device)
        created_rows.append(item)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("One or more devices could not be assigned") from None

    for item in created_rows:
        db.refresh(item)
    _recalculate_total(db, order_id)
    return created_rows


def update_sales_order_status(db: Session, order: SalesOrder, payload: SalesOrderStatusUpdate) -> SalesOrder:
    previous = order.status
    new_status = payload.status

    if new_status == SalesOrderStatus.cancelled and previous in CANCEL_BLOCKED_STATUSES:
        raise ValueError("Cannot cancel an order that is shipped or delivered")

    order.status = new_status
    db.add(order)
    db.commit()
    db.refresh(order)

    _sync_devices_with_order_status(db, order)
    db.refresh(order)
    return order


def get_order_detail(db: Session, order_id: int) -> SalesOrder | None:
    return (
        db.query(SalesOrder)
        .options(
            joinedload(SalesOrder.customer),
            joinedload(SalesOrder.items).joinedload(SalesOrderItem.device),
        )
        .filter(SalesOrder.id == order_id)
        .first()
    )
