from decimal import Decimal
from enum import Enum

from sqlalchemy import Enum as SqlEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class SalesOrderStatus(str, Enum):
    draft = "draft"
    confirmed = "confirmed"
    packed = "packed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class SalesOrder(Base, TimestampMixin):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    order_number: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    status: Mapped[SalesOrderStatus] = mapped_column(
        SqlEnum(SalesOrderStatus, name="sales_order_status"),
        default=SalesOrderStatus.draft,
    )
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    customer = relationship("Customer", back_populates="sales_orders")
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")
    return_requests = relationship("ReturnRequest", back_populates="sales_order")


class SalesOrderItem(Base, TimestampMixin):
    __tablename__ = "sales_order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"), index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), unique=True, index=True)
    selling_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    sales_order = relationship("SalesOrder", back_populates="items")
    device = relationship("Device", back_populates="sales_order_item")
