from datetime import date

from pydantic import Field

from app.schemas.base import SchemaModel, TimestampReadSchema


class InventoryBatchCreate(SchemaModel):
    batch_code: str = Field(min_length=1, max_length=80)
    supplier_id: int
    purchase_order_id: int | None = None
    received_date: date | None = None
    notes: str | None = None


class InventoryBatchUpdate(SchemaModel):
    batch_code: str | None = Field(default=None, min_length=1, max_length=80)
    supplier_id: int | None = None
    purchase_order_id: int | None = None
    received_date: date | None = None
    notes: str | None = None


class InventoryBatchRead(TimestampReadSchema):
    id: int
    batch_code: str
    supplier_id: int
    purchase_order_id: int | None
    received_date: date | None
    total_received: int
    notes: str | None
    created_by: int | None
