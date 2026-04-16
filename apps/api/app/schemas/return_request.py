from datetime import datetime

from pydantic import Field

from app.models.return_request import ReturnRequestStatus
from app.schemas.base import SchemaModel, TimestampReadSchema
from app.schemas.device import DeviceRead
from app.schemas.sales_order import SalesOrderRead


class ReturnRequestCreate(SchemaModel):
    sales_order_id: int
    device_id: int
    reason: str | None = None
    issue_description: str | None = None
    status: ReturnRequestStatus = ReturnRequestStatus.requested


class ReturnRequestStatusUpdate(SchemaModel):
    status: ReturnRequestStatus
    resolution_notes: str | None = None


class ReturnRequestRead(TimestampReadSchema):
    id: int
    sales_order_id: int
    device_id: int
    reason: str | None
    issue_description: str | None
    status: ReturnRequestStatus
    resolution_notes: str | None
    processed_at: datetime | None


class ReturnRequestReadDetailed(ReturnRequestRead):
    sales_order: SalesOrderRead | None = None
    device: DeviceRead | None = None
