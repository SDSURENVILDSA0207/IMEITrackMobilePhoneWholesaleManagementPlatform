from decimal import Decimal
from enum import Enum

from sqlalchemy import Enum as SqlEnum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class DeviceConditionGrade(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class DeviceLockStatus(str, Enum):
    unlocked = "unlocked"
    carrier_locked = "carrier_locked"
    icloud_locked = "icloud_locked"
    mdm_locked = "mdm_locked"


class DeviceStatus(str, Enum):
    available = "available"
    in_stock = "in_stock"
    reserved = "reserved"
    sold = "sold"
    return_requested = "return_requested"
    returned = "returned"


class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    condition_grade: Mapped[DeviceConditionGrade] = mapped_column(SqlEnum(DeviceConditionGrade, name="device_condition_grade"))
    battery_health: Mapped[int] = mapped_column(Integer)
    lock_status: Mapped[DeviceLockStatus] = mapped_column(SqlEnum(DeviceLockStatus, name="device_lock_status"), default=DeviceLockStatus.unlocked)
    imei: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    purchase_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    selling_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[DeviceStatus] = mapped_column(SqlEnum(DeviceStatus, name="device_status"), default=DeviceStatus.available)

    product_model_id: Mapped[int | None] = mapped_column(ForeignKey("product_models.id"), nullable=True, index=True)
    source_batch_id: Mapped[int | None] = mapped_column(ForeignKey("inventory_batches.id"), nullable=True, index=True)
    supplier_id: Mapped[int | None] = mapped_column(ForeignKey("suppliers.id"), nullable=True, index=True)

    product_model = relationship("ProductModel", back_populates="devices")
    source_batch = relationship("InventoryBatch", back_populates="devices")
    supplier = relationship("Supplier", back_populates="devices")
    sales_order_item = relationship("SalesOrderItem", back_populates="device", uselist=False)
    return_requests = relationship("ReturnRequest", back_populates="device")
