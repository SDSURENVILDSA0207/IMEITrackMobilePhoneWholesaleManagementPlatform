"""Compatibility exports for legacy imports.

Prefer importing from dedicated model modules directly.
"""

from app.models.customer import Customer
from app.models.device import Device
from app.models.inventory_batch import InventoryBatch
from app.models.product_model import ProductModel
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.return_request import ReturnRequest
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.supplier import Supplier

# Backward-compat aliases
DeviceModel = ProductModel
ReturnRMA = ReturnRequest

__all__ = [
    "Supplier",
    "Customer",
    "ProductModel",
    "InventoryBatch",
    "Device",
    "PurchaseOrder",
    "PurchaseOrderItem",
    "SalesOrder",
    "SalesOrderItem",
    "ReturnRequest",
    "DeviceModel",
    "ReturnRMA",
]
