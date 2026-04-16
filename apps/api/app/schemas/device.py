from decimal import Decimal

from pydantic import Field, field_validator

from app.models.device import DeviceConditionGrade, DeviceLockStatus, DeviceStatus
from app.schemas.base import SchemaModel, TimestampReadSchema
from app.schemas.inventory_batch import InventoryBatchRead
from app.schemas.product_model import ProductModelRead
from app.schemas.supplier import SupplierRead


class DeviceCreate(SchemaModel):
    product_model_id: int
    condition_grade: DeviceConditionGrade
    battery_health: int = Field(ge=0, le=100)
    lock_status: DeviceLockStatus = DeviceLockStatus.unlocked
    imei: str = Field(min_length=14, max_length=32)
    purchase_cost: Decimal | None = None
    selling_price: Decimal | None = None
    status: DeviceStatus = DeviceStatus.available
    source_batch_id: int | None = None
    supplier_id: int | None = None

    @field_validator("imei")
    @classmethod
    def imei_should_be_numeric(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError("IMEI must contain digits only")
        return value


class DeviceUpdate(SchemaModel):
    product_model_id: int | None = None
    condition_grade: DeviceConditionGrade | None = None
    battery_health: int | None = Field(default=None, ge=0, le=100)
    lock_status: DeviceLockStatus | None = None
    purchase_cost: Decimal | None = None
    selling_price: Decimal | None = None
    status: DeviceStatus | None = None
    source_batch_id: int | None = None
    supplier_id: int | None = None


class DeviceRead(TimestampReadSchema):
    id: int
    product_model_id: int | None
    condition_grade: DeviceConditionGrade
    battery_health: int
    lock_status: DeviceLockStatus
    imei: str
    purchase_cost: Decimal | None
    selling_price: Decimal | None
    status: DeviceStatus
    source_batch_id: int | None
    supplier_id: int | None


class DeviceReadDetailed(DeviceRead):
    product_model: ProductModelRead | None = None
    source_batch: InventoryBatchRead | None = None
    supplier: SupplierRead | None = None
