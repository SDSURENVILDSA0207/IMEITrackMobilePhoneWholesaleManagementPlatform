from decimal import Decimal
from datetime import date
from enum import Enum

from sqlalchemy import Date, Enum as SqlEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class PurchaseOrderStatus(str, Enum):
    draft = "draft"
    ordered = "ordered"
    partially_received = "partially_received"
    received = "received"
    cancelled = "cancelled"


class PurchaseOrder(Base, TimestampMixin):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    po_number: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    status: Mapped[PurchaseOrderStatus] = mapped_column(SqlEnum(PurchaseOrderStatus, name="purchase_order_status"), default=PurchaseOrderStatus.draft)
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    inventory_batches = relationship("InventoryBatch", back_populates="purchase_order")


class PurchaseOrderItem(Base, TimestampMixin):
    __tablename__ = "purchase_order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), index=True)
    brand: Mapped[str] = mapped_column(String(100), index=True)
    model_name: Mapped[str] = mapped_column(String(150), index=True)
    storage: Mapped[str] = mapped_column(String(50))
    color: Mapped[str] = mapped_column(String(50))
    expected_quantity: Mapped[int] = mapped_column(default=1)
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
