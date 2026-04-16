from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class ReturnRequestStatus(str, Enum):
    requested = "requested"
    approved = "approved"
    rejected = "rejected"
    repaired = "repaired"
    replaced = "replaced"
    refunded = "refunded"


class ReturnRequest(Base, TimestampMixin):
    __tablename__ = "return_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"), index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), index=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    issue_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReturnRequestStatus] = mapped_column(
        SqlEnum(ReturnRequestStatus, name="return_request_status"),
        default=ReturnRequestStatus.requested,
    )
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sales_order = relationship("SalesOrder", back_populates="return_requests")
    device = relationship("Device", back_populates="return_requests")
