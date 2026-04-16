from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class InventoryBatch(Base, TimestampMixin):
    __tablename__ = "inventory_batches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    batch_code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    purchase_order_id: Mapped[int | None] = mapped_column(ForeignKey("purchase_orders.id"), nullable=True, index=True)
    received_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_received: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    supplier = relationship("Supplier", back_populates="inventory_batches")
    purchase_order = relationship("PurchaseOrder", back_populates="inventory_batches")
    devices = relationship("Device", back_populates="source_batch")
