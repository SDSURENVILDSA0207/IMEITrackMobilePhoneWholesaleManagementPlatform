from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.schemas.device import DeviceCreate, DeviceRead, DeviceReadDetailed, DeviceUpdate
from app.schemas.inventory_batch import InventoryBatchCreate, InventoryBatchRead, InventoryBatchUpdate
from app.schemas.product_model import ProductModelCreate, ProductModelRead, ProductModelUpdate
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderItemCreate,
    PurchaseOrderItemRead,
    PurchaseOrderItemUpdate,
    PurchaseOrderRead,
    PurchaseOrderReadDetailed,
    PurchaseOrderStatusUpdate,
    PurchaseOrderUpdate,
)
from app.schemas.return_request import (
    ReturnRequestCreate,
    ReturnRequestRead,
    ReturnRequestReadDetailed,
    ReturnRequestStatusUpdate,
)
from app.schemas.sales_order import (
    SalesOrderCreate,
    SalesOrderItemAdd,
    SalesOrderItemBulkAdd,
    SalesOrderItemRead,
    SalesOrderItemReadDetailed,
    SalesOrderRead,
    SalesOrderReadDetailed,
    SalesOrderStatusUpdate,
)
from app.schemas.supplier import SupplierCreate, SupplierRead, SupplierUpdate
