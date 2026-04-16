from decimal import Decimal
from datetime import date

from pydantic import Field

from app.models.purchase_order import PurchaseOrderStatus
from app.schemas.base import SchemaModel, TimestampReadSchema
from app.schemas.supplier import SupplierRead


class PurchaseOrderItemCreate(SchemaModel):
    brand: str = Field(min_length=1, max_length=100)
    model_name: str = Field(min_length=1, max_length=150)
    storage: str = Field(min_length=1, max_length=50)
    color: str = Field(min_length=1, max_length=50)
    expected_quantity: int = Field(ge=1)
    unit_cost: Decimal | None = None


class PurchaseOrderItemUpdate(SchemaModel):
    brand: str | None = Field(default=None, min_length=1, max_length=100)
    model_name: str | None = Field(default=None, min_length=1, max_length=150)
    storage: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = Field(default=None, min_length=1, max_length=50)
    expected_quantity: int | None = Field(default=None, ge=1)
    unit_cost: Decimal | None = None


class PurchaseOrderItemRead(TimestampReadSchema):
    id: int
    purchase_order_id: int
    brand: str
    model_name: str
    storage: str
    color: str
    expected_quantity: int
    unit_cost: Decimal | None


class PurchaseOrderCreate(SchemaModel):
    po_number: str = Field(min_length=1, max_length=80)
    supplier_id: int
    status: PurchaseOrderStatus = PurchaseOrderStatus.draft
    expected_delivery_date: date | None = None
    notes: str | None = None
    items: list[PurchaseOrderItemCreate] = Field(default_factory=list)


class PurchaseOrderUpdate(SchemaModel):
    po_number: str | None = Field(default=None, min_length=1, max_length=80)
    supplier_id: int | None = None
    expected_delivery_date: date | None = None
    notes: str | None = None


class PurchaseOrderRead(TimestampReadSchema):
    id: int
    po_number: str
    supplier_id: int
    created_by: int | None
    status: PurchaseOrderStatus
    expected_delivery_date: date | None
    notes: str | None
    total_amount: Decimal | None


class PurchaseOrderReadDetailed(PurchaseOrderRead):
    supplier: SupplierRead | None = None
    items: list[PurchaseOrderItemRead] = Field(default_factory=list)


class PurchaseOrderStatusUpdate(SchemaModel):
    status: PurchaseOrderStatus
