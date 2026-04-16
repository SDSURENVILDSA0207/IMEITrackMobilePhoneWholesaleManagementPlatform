from pydantic import BaseModel, Field

from app.models.device import DeviceConditionGrade, DeviceLockStatus, DeviceStatus
from app.schemas.device import DeviceRead


class IntakeDeviceCreate(BaseModel):
    imei: str = Field(min_length=14, max_length=32)
    product_model_id: int
    condition_grade: DeviceConditionGrade
    battery_health: int = Field(ge=0, le=100)
    lock_status: DeviceLockStatus = DeviceLockStatus.unlocked
    purchase_cost: float | None = None
    selling_price: float | None = None
    status: DeviceStatus = DeviceStatus.available


class IntakeDeviceBulkCreate(BaseModel):
    devices: list[IntakeDeviceCreate] = Field(min_length=1)


class BatchDevicesRead(BaseModel):
    batch_id: int
    total: int
    devices: list[DeviceRead]
