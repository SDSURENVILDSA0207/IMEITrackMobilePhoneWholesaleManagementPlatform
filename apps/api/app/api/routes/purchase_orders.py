from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.http_exceptions import not_found
from app.db.session import get_db
from app.models.user import User
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderItemRead,
    PurchaseOrderReadDetailed,
    PurchaseOrderStatusUpdate,
    PurchaseOrderUpdate,
)
from app.services.purchase_order_service import (
    create_purchase_order,
    get_purchase_order_by_id,
    list_items_by_purchase_order,
    list_purchase_orders,
    update_purchase_order,
    update_purchase_order_status,
)

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


@router.post("", response_model=PurchaseOrderReadDetailed, status_code=status.HTTP_201_CREATED)
def create_purchase_order_endpoint(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inventory_manager")),
) -> PurchaseOrderReadDetailed:
    po = create_purchase_order(db, payload, created_by=current_user.id)
    po = get_purchase_order_by_id(db, po.id)
    return PurchaseOrderReadDetailed.model_validate(po)


@router.get("", response_model=list[PurchaseOrderReadDetailed])
def list_purchase_orders_endpoint(
    status_value: str | None = Query(default=None, alias="status"),
    supplier_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[PurchaseOrderReadDetailed]:
    purchase_orders = list_purchase_orders(db, status_value=status_value, supplier_id=supplier_id)
    return [PurchaseOrderReadDetailed.model_validate(item) for item in purchase_orders]


@router.get("/{purchase_order_id}", response_model=PurchaseOrderReadDetailed)
def get_purchase_order_endpoint(
    purchase_order_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> PurchaseOrderReadDetailed:
    po = get_purchase_order_by_id(db, purchase_order_id)
    if po is None:
        raise not_found("Purchase order")
    return PurchaseOrderReadDetailed.model_validate(po)


@router.patch("/{purchase_order_id}/status", response_model=PurchaseOrderReadDetailed)
def update_purchase_order_status_endpoint(
    purchase_order_id: int,
    payload: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> PurchaseOrderReadDetailed:
    po = get_purchase_order_by_id(db, purchase_order_id)
    if po is None:
        raise not_found("Purchase order")
    po = update_purchase_order_status(db, po, payload)
    po = get_purchase_order_by_id(db, purchase_order_id)
    return PurchaseOrderReadDetailed.model_validate(po)


@router.put("/{purchase_order_id}", response_model=PurchaseOrderReadDetailed)
def update_purchase_order_endpoint(
    purchase_order_id: int,
    payload: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> PurchaseOrderReadDetailed:
    po = get_purchase_order_by_id(db, purchase_order_id)
    if po is None:
        raise not_found("Purchase order")
    po = update_purchase_order(db, po, payload)
    po = get_purchase_order_by_id(db, purchase_order_id)
    return PurchaseOrderReadDetailed.model_validate(po)


@router.get("/{purchase_order_id}/items", response_model=list[PurchaseOrderItemRead])
def list_purchase_order_items_endpoint(
    purchase_order_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[PurchaseOrderItemRead]:
    po = get_purchase_order_by_id(db, purchase_order_id)
    if po is None:
        raise not_found("Purchase order")
    items = list_items_by_purchase_order(db, purchase_order_id)
    return [PurchaseOrderItemRead.model_validate(item) for item in items]
