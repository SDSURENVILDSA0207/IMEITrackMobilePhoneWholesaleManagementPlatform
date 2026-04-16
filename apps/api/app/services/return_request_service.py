from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.models.device import Device, DeviceStatus
from app.models.return_request import ReturnRequest, ReturnRequestStatus
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.schemas.return_request import ReturnRequestCreate, ReturnRequestStatusUpdate

TERMINAL_PROCESS_STATUSES = frozenset(
    {
        ReturnRequestStatus.approved,
        ReturnRequestStatus.rejected,
        ReturnRequestStatus.repaired,
        ReturnRequestStatus.replaced,
        ReturnRequestStatus.refunded,
    }
)

ELIGIBLE_ORDER_STATUSES = frozenset({SalesOrderStatus.shipped, SalesOrderStatus.delivered})


def _device_belongs_to_sales_order(db: Session, sales_order_id: int, device_id: int) -> SalesOrderItem | None:
    return (
        db.query(SalesOrderItem)
        .filter(
            SalesOrderItem.sales_order_id == sales_order_id,
            SalesOrderItem.device_id == device_id,
        )
        .first()
    )


def _has_open_return_for_device(db: Session, device_id: int) -> bool:
    open_statuses = {ReturnRequestStatus.requested, ReturnRequestStatus.approved}
    existing = (
        db.query(ReturnRequest)
        .filter(ReturnRequest.device_id == device_id, ReturnRequest.status.in_(open_statuses))
        .first()
    )
    return existing is not None


def validate_return_eligibility(db: Session, sales_order_id: int, device_id: int) -> None:
    order = db.get(SalesOrder, sales_order_id)
    if order is None:
        raise ValueError("Sales order not found")

    line = _device_belongs_to_sales_order(db, sales_order_id, device_id)
    if line is None:
        raise ValueError("Device is not part of this sales order")

    if order.status not in ELIGIBLE_ORDER_STATUSES:
        raise ValueError("Sales order must be shipped or delivered before a return can be opened")

    device = db.get(Device, device_id)
    if device is None:
        raise ValueError("Device not found")

    if device.status != DeviceStatus.sold:
        raise ValueError("Only sold devices can be returned")

    if _has_open_return_for_device(db, device_id):
        raise ValueError("An open return request already exists for this device")


def create_return_request(db: Session, payload: ReturnRequestCreate) -> ReturnRequest:
    validate_return_eligibility(db, payload.sales_order_id, payload.device_id)

    ret = ReturnRequest(
        sales_order_id=payload.sales_order_id,
        device_id=payload.device_id,
        reason=payload.reason,
        issue_description=payload.issue_description,
        status=payload.status,
    )
    device = db.get(Device, payload.device_id)
    assert device is not None
    device.status = DeviceStatus.return_requested
    db.add(ret)
    db.add(device)
    db.commit()
    db.refresh(ret)
    return ret


def list_return_requests(
    db: Session,
    status: ReturnRequestStatus | None = None,
    sales_order_id: int | None = None,
    device_id: int | None = None,
) -> list[ReturnRequest]:
    q = db.query(ReturnRequest).options(
        joinedload(ReturnRequest.sales_order),
        joinedload(ReturnRequest.device),
    )
    if status is not None:
        q = q.filter(ReturnRequest.status == status)
    if sales_order_id is not None:
        q = q.filter(ReturnRequest.sales_order_id == sales_order_id)
    if device_id is not None:
        q = q.filter(ReturnRequest.device_id == device_id)
    return q.order_by(ReturnRequest.created_at.desc()).all()


def get_return_request_by_id(db: Session, return_id: int) -> ReturnRequest | None:
    return (
        db.query(ReturnRequest)
        .options(
            joinedload(ReturnRequest.sales_order),
            joinedload(ReturnRequest.device),
        )
        .filter(ReturnRequest.id == return_id)
        .first()
    )


def update_return_status(db: Session, ret: ReturnRequest, payload: ReturnRequestStatusUpdate) -> ReturnRequest:
    ret.status = payload.status
    if payload.resolution_notes is not None:
        ret.resolution_notes = payload.resolution_notes

    if payload.status in TERMINAL_PROCESS_STATUSES and ret.processed_at is None:
        ret.processed_at = datetime.now(timezone.utc)

    device = db.get(Device, ret.device_id)
    if device is not None:
        if payload.status == ReturnRequestStatus.rejected:
            device.status = DeviceStatus.sold
        elif payload.status in (
            ReturnRequestStatus.approved,
            ReturnRequestStatus.repaired,
            ReturnRequestStatus.replaced,
            ReturnRequestStatus.refunded,
        ):
            device.status = DeviceStatus.returned

    db.add(ret)
    if device is not None:
        db.add(device)
    db.commit()
    db.refresh(ret)
    return ret
