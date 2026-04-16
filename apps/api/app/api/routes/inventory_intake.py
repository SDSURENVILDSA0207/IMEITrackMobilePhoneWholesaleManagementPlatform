from fastapi import APIRouter, Depends, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.http_exceptions import conflict, not_found
from app.db.session import get_db
from app.schemas.device import DeviceRead
from app.schemas.inventory_batch import InventoryBatchCreate, InventoryBatchRead
from app.schemas.inventory_intake import BatchDevicesRead, IntakeDeviceBulkCreate, IntakeDeviceCreate
from app.models.user import User
from app.services.inventory_intake_service import (
    add_device_to_batch,
    bulk_add_devices_to_batch,
    create_inventory_batch,
    get_batch_by_id,
    list_batch_devices,
)

router = APIRouter(prefix="/inventory-intake", tags=["inventory-intake"])


@router.get("/batches/{batch_id}", response_model=InventoryBatchRead)
def get_inventory_batch_endpoint(
    batch_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> InventoryBatchRead:
    batch = get_batch_by_id(db, batch_id)
    if batch is None:
        raise not_found("Batch")
    return InventoryBatchRead.model_validate(batch)


@router.post("/batches", response_model=InventoryBatchRead, status_code=status.HTTP_201_CREATED)
def create_inventory_batch_endpoint(
    payload: InventoryBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inventory_manager")),
) -> InventoryBatchRead:
    batch = create_inventory_batch(db, payload, created_by=current_user.id)
    return InventoryBatchRead.model_validate(batch)


@router.post("/batches/{batch_id}/devices", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
def add_device_to_batch_endpoint(
    batch_id: int,
    payload: IntakeDeviceCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> DeviceRead:
    batch = get_batch_by_id(db, batch_id)
    if batch is None:
        raise not_found("Batch")
    try:
        device = add_device_to_batch(db, batch, payload)
    except IntegrityError as exc:
        raise conflict("IMEI already exists") from exc
    return DeviceRead.model_validate(device)


@router.post("/batches/{batch_id}/devices/bulk", response_model=list[DeviceRead], status_code=status.HTTP_201_CREATED)
def bulk_add_devices_to_batch_endpoint(
    batch_id: int,
    payload: IntakeDeviceBulkCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> list[DeviceRead]:
    batch = get_batch_by_id(db, batch_id)
    if batch is None:
        raise not_found("Batch")
    try:
        devices = bulk_add_devices_to_batch(db, batch, payload)
    except IntegrityError as exc:
        raise conflict("One or more IMEIs already exist") from exc
    return [DeviceRead.model_validate(item) for item in devices]


@router.get("/batches/{batch_id}/devices", response_model=BatchDevicesRead)
def list_batch_devices_endpoint(
    batch_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> BatchDevicesRead:
    batch = get_batch_by_id(db, batch_id)
    if batch is None:
        raise not_found("Batch")
    devices = list_batch_devices(db, batch_id)
    return BatchDevicesRead(
        batch_id=batch_id,
        total=len(devices),
        devices=[DeviceRead.model_validate(item) for item in devices],
    )
