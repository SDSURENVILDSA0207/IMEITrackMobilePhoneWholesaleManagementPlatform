from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.inventory_batch import InventoryBatch
from app.schemas.inventory_batch import InventoryBatchCreate
from app.schemas.inventory_intake import IntakeDeviceBulkCreate, IntakeDeviceCreate


def create_inventory_batch(db: Session, payload: InventoryBatchCreate, created_by: int | None) -> InventoryBatch:
    batch = InventoryBatch(
        batch_code=payload.batch_code,
        supplier_id=payload.supplier_id,
        purchase_order_id=payload.purchase_order_id,
        received_date=payload.received_date,
        notes=payload.notes,
        created_by=created_by,
        total_received=0,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def get_batch_by_id(db: Session, batch_id: int) -> InventoryBatch | None:
    return db.get(InventoryBatch, batch_id)


def _refresh_batch_total(db: Session, batch: InventoryBatch) -> InventoryBatch:
    total = db.query(Device).filter(Device.source_batch_id == batch.id).count()
    batch.total_received = total
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def add_device_to_batch(db: Session, batch: InventoryBatch, payload: IntakeDeviceCreate) -> Device:
    device = Device(
        imei=payload.imei,
        product_model_id=payload.product_model_id,
        condition_grade=payload.condition_grade,
        battery_health=payload.battery_health,
        lock_status=payload.lock_status,
        purchase_cost=payload.purchase_cost,
        selling_price=payload.selling_price,
        status=payload.status,
        source_batch_id=batch.id,
        supplier_id=batch.supplier_id,
    )
    db.add(device)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(device)
    _refresh_batch_total(db, batch)
    return device


def bulk_add_devices_to_batch(db: Session, batch: InventoryBatch, payload: IntakeDeviceBulkCreate) -> list[Device]:
    created_devices: list[Device] = []
    for entry in payload.devices:
        device = Device(
            imei=entry.imei,
            product_model_id=entry.product_model_id,
            condition_grade=entry.condition_grade,
            battery_health=entry.battery_health,
            lock_status=entry.lock_status,
            purchase_cost=entry.purchase_cost,
            selling_price=entry.selling_price,
            status=entry.status,
            source_batch_id=batch.id,
            supplier_id=batch.supplier_id,
        )
        db.add(device)
        created_devices.append(device)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    for device in created_devices:
        db.refresh(device)
    _refresh_batch_total(db, batch)
    return created_devices


def list_batch_devices(db: Session, batch_id: int) -> list[Device]:
    return db.query(Device).filter(Device.source_batch_id == batch_id).order_by(Device.created_at.desc()).all()
