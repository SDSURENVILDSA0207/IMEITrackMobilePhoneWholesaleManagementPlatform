from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderStatusUpdate, PurchaseOrderUpdate


def create_purchase_order(db: Session, payload: PurchaseOrderCreate, created_by: int | None) -> PurchaseOrder:
    po = PurchaseOrder(
        supplier_id=payload.supplier_id,
        po_number=payload.po_number,
        status=payload.status,
        expected_delivery_date=payload.expected_delivery_date,
        notes=payload.notes,
        created_by=created_by,
    )
    db.add(po)
    db.flush()

    total = Decimal("0")
    for item in payload.items:
        po_item = PurchaseOrderItem(
            purchase_order_id=po.id,
            brand=item.brand,
            model_name=item.model_name,
            storage=item.storage,
            color=item.color,
            expected_quantity=item.expected_quantity,
            unit_cost=item.unit_cost,
        )
        db.add(po_item)
        if item.unit_cost is not None:
            total += item.unit_cost * item.expected_quantity

    po.total_amount = total
    db.commit()
    db.refresh(po)
    return po


def list_purchase_orders(db: Session, status_value: str | None = None, supplier_id: int | None = None) -> list[PurchaseOrder]:
    query = db.query(PurchaseOrder).options(joinedload(PurchaseOrder.items), joinedload(PurchaseOrder.supplier))
    if status_value:
        query = query.filter(PurchaseOrder.status == status_value)
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    return query.order_by(PurchaseOrder.created_at.desc()).all()


def get_purchase_order_by_id(db: Session, purchase_order_id: int) -> PurchaseOrder | None:
    return (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.items), joinedload(PurchaseOrder.supplier))
        .filter(PurchaseOrder.id == purchase_order_id)
        .first()
    )


def update_purchase_order(db: Session, po: PurchaseOrder, payload: PurchaseOrderUpdate) -> PurchaseOrder:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(po, field, value)
    db.add(po)
    db.commit()
    db.refresh(po)
    return po


def update_purchase_order_status(db: Session, po: PurchaseOrder, payload: PurchaseOrderStatusUpdate) -> PurchaseOrder:
    po.status = payload.status
    db.add(po)
    db.commit()
    db.refresh(po)
    return po


def list_items_by_purchase_order(db: Session, purchase_order_id: int) -> list[PurchaseOrderItem]:
    return (
        db.query(PurchaseOrderItem)
        .filter(PurchaseOrderItem.purchase_order_id == purchase_order_id)
        .order_by(PurchaseOrderItem.created_at.asc())
        .all()
    )
