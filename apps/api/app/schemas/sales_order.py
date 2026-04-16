from decimal import Decimal

from pydantic import Field

from app.models.sales_order import SalesOrderStatus
from app.schemas.base import SchemaModel, TimestampReadSchema
from app.schemas.customer import CustomerRead
from app.schemas.device import DeviceRead


class SalesOrderItemAdd(SchemaModel):
    device_id: int
    selling_price: Decimal = Field(ge=0)


class SalesOrderItemBulkAdd(SchemaModel):
    items: list[SalesOrderItemAdd] = Field(min_length=1)


class SalesOrderItemRead(TimestampReadSchema):
    id: int
    sales_order_id: int
    device_id: int
    selling_price: Decimal


class SalesOrderItemReadDetailed(SalesOrderItemRead):
    device: DeviceRead | None = None


class SalesOrderCreate(SchemaModel):
    order_number: str = Field(min_length=1, max_length=80)
    customer_id: int
    status: SalesOrderStatus = SalesOrderStatus.draft
    notes: str | None = None


class SalesOrderStatusUpdate(SchemaModel):
    status: SalesOrderStatus


class SalesOrderRead(TimestampReadSchema):
    id: int
    customer_id: int
    order_number: str
    status: SalesOrderStatus
    total_amount: Decimal | None
    notes: str | None
    created_by: int | None


class SalesOrderReadDetailed(SalesOrderRead):
    customer: CustomerRead | None = None
    items: list[SalesOrderItemReadDetailed] = Field(default_factory=list)
