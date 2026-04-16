from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.entities import Device, InventoryReceipt, PurchaseOrder, SalesOrder
from app.models.return_request import ReturnRequest
from app.models.sales_order import SalesOrderStatus

router = APIRouter(tags=["trade"])


@router.get("/purchase-orders")
def list_purchase_orders(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(PurchaseOrder).order_by(PurchaseOrder.id.desc()).all()


@router.post("/purchase-orders")
def create_purchase_order(supplier_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    record = PurchaseOrder(po_number=f"PO-{supplier_id}-{db.query(PurchaseOrder).count()+1}", supplier_id=supplier_id, status="draft")
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/inventory-receipts")
def list_inventory_receipts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(InventoryReceipt).order_by(InventoryReceipt.id.desc()).all()


@router.post("/inventory-receipts")
def create_inventory_receipt(purchase_order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    record = InventoryReceipt(
        receipt_number=f"GRN-{purchase_order_id}-{db.query(InventoryReceipt).count()+1}",
        purchase_order_id=purchase_order_id,
        received_by=current_user.id,
        status="received",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/devices")
def list_devices(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Device).order_by(Device.id.desc()).all()


@router.post("/devices")
def create_device(imei: str, model_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    record = Device(imei=imei, model_id=model_id, status="available")
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/sales-orders")
def list_sales_orders(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(SalesOrder).order_by(SalesOrder.id.desc()).all()


@router.post("/sales-orders")
def create_sales_order(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    record = SalesOrder(
        order_number=f"SO-{customer_id}-{db.query(SalesOrder).count()+1}",
        customer_id=customer_id,
        status=SalesOrderStatus.draft,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/returns")
def list_returns(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(ReturnRequest).order_by(ReturnRequest.id.desc()).all()
