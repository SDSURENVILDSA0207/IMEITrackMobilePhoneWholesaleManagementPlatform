from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class ProductModel(Base, TimestampMixin):
    __tablename__ = "product_models"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    brand: Mapped[str] = mapped_column(String(100), index=True)
    model_name: Mapped[str] = mapped_column(String(150), index=True)
    storage: Mapped[str] = mapped_column(String(50))
    color: Mapped[str] = mapped_column(String(50))
    default_condition_type: Mapped[str | None] = mapped_column(String(20), nullable=True)

    devices = relationship("Device", back_populates="product_model")
