from sqlalchemy.orm import Session

from app.models.device import Device, DeviceStatus
from app.models.product_model import ProductModel
from app.schemas.device import DeviceCreate, DeviceUpdate


def create_device(db: Session, payload: DeviceCreate) -> Device:
    device = Device(**payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def list_devices(
    db: Session,
    brand: str | None = None,
    model_name: str | None = None,
    condition_grade: str | None = None,
    lock_status: str | None = None,
    status: str | None = None,
) -> list[Device]:
    query = db.query(Device).join(ProductModel, ProductModel.id == Device.product_model_id, isouter=True)
    if brand:
        query = query.filter(ProductModel.brand.ilike(f"%{brand.strip()}%"))
    if model_name:
        query = query.filter(ProductModel.model_name.ilike(f"%{model_name.strip()}%"))
    if condition_grade:
        query = query.filter(Device.condition_grade == condition_grade)
    if lock_status:
        query = query.filter(Device.lock_status == lock_status)
    if status:
        query = query.filter(Device.status == status)
    return query.order_by(Device.created_at.desc()).all()


def get_device_by_id(db: Session, device_id: int) -> Device | None:
    return db.get(Device, device_id)


def get_device_by_imei(db: Session, imei: str) -> Device | None:
    return db.query(Device).filter(Device.imei == imei).first()


def update_device(db: Session, device: Device, payload: DeviceUpdate) -> Device:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def update_device_status(db: Session, device: Device, status: DeviceStatus) -> Device:
    device.status = status
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def delete_device(db: Session, device: Device) -> None:
    db.delete(device)
    db.commit()
