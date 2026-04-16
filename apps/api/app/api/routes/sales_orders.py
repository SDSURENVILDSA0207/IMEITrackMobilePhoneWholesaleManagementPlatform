from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_roles
from app.api.http_exceptions import bad_request, not_found
from app.db.session import get_db
from app.models.sales_order import SalesOrderItem, SalesOrderStatus
from app.models.user import User
from app.schemas.sales_order import (
    SalesOrderCreate,
    SalesOrderItemAdd,
    SalesOrderItemBulkAdd,
    SalesOrderItemReadDetailed,
    SalesOrderRead,
    SalesOrderReadDetailed,
    SalesOrderStatusUpdate,
)
from app.services import sales_order_service as so_svc

router = APIRouter(prefix="/sales-orders", tags=["sales-orders"])


@router.post("", response_model=SalesOrderRead, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "sales_manager")),
) -> SalesOrderRead:
    order = so_svc.create_sales_order(db, payload, created_by=current_user.id)
    return SalesOrderRead.model_validate(order)


@router.get("", response_model=list[SalesOrderRead])
def list_sales_orders(
    status_filter: SalesOrderStatus | None = Query(default=None, alias="status"),
    customer_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[SalesOrderRead]:
    orders = so_svc.list_sales_orders(db, status=status_filter, customer_id=customer_id)
    return [SalesOrderRead.model_validate(o) for o in orders]


@router.get("/{order_id}", response_model=SalesOrderReadDetailed)
def get_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> SalesOrderReadDetailed:
    order = so_svc.get_order_detail(db, order_id)
    if order is None:
        raise not_found("Sales order")
    return SalesOrderReadDetailed.model_validate(order)


@router.post("/{order_id}/devices", response_model=SalesOrderItemReadDetailed, status_code=status.HTTP_201_CREATED)
def add_device_to_order(
    order_id: int,
    payload: SalesOrderItemAdd,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "sales_manager")),
) -> SalesOrderItemReadDetailed:
    try:
        item = so_svc.add_device_to_sales_order(db, order_id, payload)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc

    item = (
        db.query(SalesOrderItem)
        .options(joinedload(SalesOrderItem.device))
        .filter(SalesOrderItem.id == item.id)
        .first()
    )
    return SalesOrderItemReadDetailed.model_validate(item)


@router.post("/{order_id}/devices/bulk", response_model=list[SalesOrderItemReadDetailed], status_code=status.HTTP_201_CREATED)
def bulk_add_devices(
    order_id: int,
    payload: SalesOrderItemBulkAdd,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "sales_manager")),
) -> list[SalesOrderItemReadDetailed]:
    try:
        items = so_svc.bulk_add_devices_to_sales_order(db, order_id, payload.items)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc

    ids = [i.id for i in items]
    loaded = (
        db.query(SalesOrderItem)
        .options(joinedload(SalesOrderItem.device))
        .filter(SalesOrderItem.id.in_(ids))
        .all()
    )
    by_id = {i.id: i for i in loaded}
    ordered = [by_id[i] for i in ids if i in by_id]
    return [SalesOrderItemReadDetailed.model_validate(i) for i in ordered]


@router.patch("/{order_id}/status", response_model=SalesOrderReadDetailed)
def update_order_status(
    order_id: int,
    payload: SalesOrderStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "sales_manager")),
) -> SalesOrderReadDetailed:
    order = so_svc.get_sales_order_by_id(db, order_id)
    if order is None:
        raise not_found("Sales order")
    try:
        so_svc.update_sales_order_status(db, order, payload)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    order = so_svc.get_order_detail(db, order_id)
    assert order is not None
    return SalesOrderReadDetailed.model_validate(order)
