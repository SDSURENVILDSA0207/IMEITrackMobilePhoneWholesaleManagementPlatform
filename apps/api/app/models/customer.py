from decimal import Decimal

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    business_name: Mapped[str] = mapped_column(String(255), index=True)
    contact_person: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    billing_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    credit_limit: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    outstanding_balance: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    sales_orders = relationship("SalesOrder", back_populates="customer")
