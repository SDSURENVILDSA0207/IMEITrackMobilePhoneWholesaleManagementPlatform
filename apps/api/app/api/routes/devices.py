from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.http_exceptions import conflict, not_found
from app.db.session import get_db
from app.models.device import DeviceStatus
from app.schemas.device import DeviceCreate, DeviceReadDetailed, DeviceUpdate
from app.services.device_service import (
    create_device,
    delete_device,
    get_device_by_id,
    get_device_by_imei,
    list_devices,
    update_device,
    update_device_status,
)

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("", response_model=DeviceReadDetailed, status_code=status.HTTP_201_CREATED)
def create_device_endpoint(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> DeviceReadDetailed:
    try:
        device = create_device(db, payload)
    except IntegrityError as exc:
        db.rollback()
        raise conflict("IMEI already exists") from exc
    return DeviceReadDetailed.model_validate(device)


@router.get("", response_model=list[DeviceReadDetailed])
def list_devices_endpoint(
    brand: str | None = Query(default=None),
    model_name: str | None = Query(default=None),
    condition_grade: str | None = Query(default=None),
    lock_status: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[DeviceReadDetailed]:
    devices = list_devices(
        db,
        brand=brand,
        model_name=model_name,
        condition_grade=condition_grade,
        lock_status=lock_status,
        status=status,
    )
    return [DeviceReadDetailed.model_validate(item) for item in devices]


@router.get("/search/by-imei", response_model=DeviceReadDetailed)
def search_device_by_imei_endpoint(
    imei: str = Query(..., min_length=14, max_length=32),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> DeviceReadDetailed:
    device = get_device_by_imei(db, imei)
    if device is None:
        raise not_found("Device")
    return DeviceReadDetailed.model_validate(device)


@router.get("/{device_id}", response_model=DeviceReadDetailed)
def get_device_endpoint(
    device_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> DeviceReadDetailed:
    device = get_device_by_id(db, device_id)
    if device is None:
        raise not_found("Device")
    return DeviceReadDetailed.model_validate(device)


@router.put("/{device_id}", response_model=DeviceReadDetailed)
def update_device_endpoint(
    device_id: int,
    payload: DeviceUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> DeviceReadDetailed:
    device = get_device_by_id(db, device_id)
    if device is None:
        raise not_found("Device")
    device = update_device(db, device, payload)
    return DeviceReadDetailed.model_validate(device)


@router.patch("/{device_id}/status", response_model=DeviceReadDetailed)
def update_device_status_endpoint(
    device_id: int,
    status_value: DeviceStatus = Query(..., alias="status"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> DeviceReadDetailed:
    device = get_device_by_id(db, device_id)
    if device is None:
        raise not_found("Device")
    device = update_device_status(db, device, status_value)
    return DeviceReadDetailed.model_validate(device)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device_endpoint(
    device_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> None:
    device = get_device_by_id(db, device_id)
    if device is None:
        raise not_found("Device")
    delete_device(db, device)
