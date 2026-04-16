from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.device import Device, DeviceConditionGrade, DeviceStatus
from app.models.product_model import ProductModel
from app.models.purchase_order import PurchaseOrder
from app.models.return_request import ReturnRequest, ReturnRequestStatus
from app.models.sales_order import SalesOrder
from app.models.supplier import Supplier
from app.schemas.analytics import (
    ConditionGradeCount,
    DashboardAnalytics,
    KpiCounts,
    LowStockProductModelRow,
    LowStockSummary,
    RecentPurchaseOrderRow,
    RecentSalesOrderRow,
    ReturnStatusCount,
)

AVAILABLE_STOCK_STATUSES = (DeviceStatus.available, DeviceStatus.in_stock)


def get_kpi_counts(db: Session) -> KpiCounts:
    """KPI counts; each uses an indexed COUNT(*) pattern."""
    return KpiCounts(
        total_suppliers=int(db.scalar(select(func.count(Supplier.id))) or 0),
        total_customers=int(db.scalar(select(func.count(Customer.id))) or 0),
        total_available_devices=int(
            db.scalar(select(func.count(Device.id)).where(Device.status == DeviceStatus.available)) or 0
        ),
        total_sold_devices=int(db.scalar(select(func.count(Device.id)).where(Device.status == DeviceStatus.sold)) or 0),
        total_reserved_devices=int(
            db.scalar(select(func.count(Device.id)).where(Device.status == DeviceStatus.reserved)) or 0
        ),
    )


def get_low_stock_by_product_model(
    db: Session,
    *,
    threshold: int = 5,
    limit: int = 50,
) -> LowStockSummary:
    """
    Product models where count of devices in available/in_stock status is at or below threshold.
    Uses LEFT JOIN so models with zero sellable inventory are included.
    Ordered by available_units ascending (scarcest first).
    """
    cnt = func.count(Device.id).label("available_units")
    stmt = (
        select(
            ProductModel.id,
            ProductModel.brand,
            ProductModel.model_name,
            ProductModel.storage,
            ProductModel.color,
            cnt,
        )
        .select_from(ProductModel)
        .outerjoin(
            Device,
            and_(
                Device.product_model_id == ProductModel.id,
                Device.status.in_(AVAILABLE_STOCK_STATUSES),
            ),
        )
        .group_by(
            ProductModel.id,
            ProductModel.brand,
            ProductModel.model_name,
            ProductModel.storage,
            ProductModel.color,
        )
        .having(cnt <= threshold)
        .order_by(cnt.asc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return LowStockSummary(
        threshold=threshold,
        rows=[
            LowStockProductModelRow(
                product_model_id=r.id,
                brand=r.brand,
                model_name=r.model_name,
                storage=r.storage,
                color=r.color,
                available_units=int(r.available_units),
            )
            for r in rows
        ],
    )


def get_recent_purchase_orders(db: Session, *, limit: int = 10) -> list[RecentPurchaseOrderRow]:
    orders = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.supplier))
        .order_by(PurchaseOrder.created_at.desc())
        .limit(limit)
        .all()
    )
    out: list[RecentPurchaseOrderRow] = []
    for po in orders:
        supplier = po.supplier
        out.append(
            RecentPurchaseOrderRow(
                id=po.id,
                po_number=po.po_number,
                supplier_id=po.supplier_id,
                supplier_name=supplier.name if supplier else None,
                status=po.status,
                total_amount=po.total_amount,
                created_at=po.created_at,
            )
        )
    return out


def get_recent_sales_orders(db: Session, *, limit: int = 10) -> list[RecentSalesOrderRow]:
    orders = (
        db.query(SalesOrder)
        .options(joinedload(SalesOrder.customer))
        .order_by(SalesOrder.created_at.desc())
        .limit(limit)
        .all()
    )
    out: list[RecentSalesOrderRow] = []
    for so in orders:
        cust = so.customer
        out.append(
            RecentSalesOrderRow(
                id=so.id,
                order_number=so.order_number,
                customer_id=so.customer_id,
                customer_name=cust.business_name if cust else None,
                status=so.status,
                total_amount=so.total_amount,
                created_at=so.created_at,
            )
        )
    return out


def get_return_summary_by_status(db: Session) -> list[ReturnStatusCount]:
    stmt = (
        select(ReturnRequest.status, func.count(ReturnRequest.id))
        .group_by(ReturnRequest.status)
        .order_by(ReturnRequest.status)
    )
    rows = db.execute(stmt).all()
    known = {r.status: int(r[1]) for r in rows}
    result: list[ReturnStatusCount] = []
    for status in ReturnRequestStatus:
        result.append(ReturnStatusCount(status=status, count=known.get(status, 0)))
    return result


def get_inventory_count_by_condition_grade(db: Session) -> list[ConditionGradeCount]:
    stmt = (
        select(Device.condition_grade, func.count(Device.id))
        .group_by(Device.condition_grade)
        .order_by(Device.condition_grade)
    )
    rows = db.execute(stmt).all()
    return [
        ConditionGradeCount(condition_grade=grade.value if isinstance(grade, DeviceConditionGrade) else str(grade), count=int(cnt))
        for grade, cnt in rows
    ]


def get_dashboard(db: Session, *, low_stock_threshold: int = 5, recent_limit: int = 10) -> DashboardAnalytics:
    return DashboardAnalytics(
        kpis=get_kpi_counts(db),
        low_stock=get_low_stock_by_product_model(db, threshold=low_stock_threshold, limit=50),
        recent_purchase_orders=get_recent_purchase_orders(db, limit=recent_limit),
        recent_sales_orders=get_recent_sales_orders(db, limit=recent_limit),
        returns_by_status=get_return_summary_by_status(db),
        inventory_by_condition_grade=get_inventory_count_by_condition_grade(db),
    )
