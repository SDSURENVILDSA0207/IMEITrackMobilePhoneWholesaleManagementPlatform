from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.purchase_order import PurchaseOrderStatus
from app.models.return_request import ReturnRequestStatus
from app.models.sales_order import SalesOrderStatus


class KpiCounts(BaseModel):
    total_suppliers: int
    total_customers: int
    total_available_devices: int
    total_sold_devices: int
    total_reserved_devices: int


class LowStockProductModelRow(BaseModel):
    product_model_id: int
    brand: str
    model_name: str
    storage: str
    color: str
    available_units: int


class LowStockSummary(BaseModel):
    threshold: int
    rows: list[LowStockProductModelRow]


class RecentPurchaseOrderRow(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_name: str | None
    status: PurchaseOrderStatus
    total_amount: Decimal | None
    created_at: datetime


class RecentSalesOrderRow(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer_name: str | None
    status: SalesOrderStatus
    total_amount: Decimal | None
    created_at: datetime


class ReturnStatusCount(BaseModel):
    status: ReturnRequestStatus
    count: int


class ConditionGradeCount(BaseModel):
    condition_grade: str
    count: int


class DashboardAnalytics(BaseModel):
    kpis: KpiCounts
    low_stock: LowStockSummary
    recent_purchase_orders: list[RecentPurchaseOrderRow]
    recent_sales_orders: list[RecentSalesOrderRow]
    returns_by_status: list[ReturnStatusCount]
    inventory_by_condition_grade: list[ConditionGradeCount]
