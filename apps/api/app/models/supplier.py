from enum import Enum

from sqlalchemy import Enum as SqlEnum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class SupplierType(str, Enum):
    manufacturer = "manufacturer"
    distributor = "distributor"
    wholesaler = "wholesaler"
    broker = "broker"


class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    contact_person: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    supplier_type: Mapped[SupplierType] = mapped_column(
        SqlEnum(SupplierType, name="supplier_type"),
        default=SupplierType.wholesaler,
    )
    payment_terms: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    inventory_batches = relationship("InventoryBatch", back_populates="supplier")
    devices = relationship("Device", back_populates="supplier")
