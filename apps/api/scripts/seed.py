#!/usr/bin/env python3
"""
Seed realistic demo data for IMEITrack (local development).

Usage (from apps/api):
  python -m scripts.seed
  python -m scripts.seed --force   # wipe app tables first, then seed

Requires DATABASE_URL / .env pointing at your Postgres instance (see app/core/config.py).
Default login after seed matches README: admin@imeitrack.app / Admin123!
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path

# Ensure `app` package is importable when run as `python -m scripts.seed`
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.customer import Customer
from app.models.device import Device, DeviceConditionGrade, DeviceLockStatus, DeviceStatus
from app.models.inventory_batch import InventoryBatch
from app.models.product_model import ProductModel
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.return_request import ReturnRequest
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.models.supplier import Supplier, SupplierType
from app.models.user import User, UserRole
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderItemCreate
from app.schemas.return_request import ReturnRequestCreate
from app.schemas.sales_order import SalesOrderCreate, SalesOrderItemAdd, SalesOrderStatusUpdate
from app.services import purchase_order_service as po_svc
from app.services import return_request_service as rma_svc
from app.services import sales_order_service as so_svc

PASSWORD = "Admin123!"
ADMIN_EMAIL = "admin@imeitrack.app"
INVENTORY_EMAIL = "inventory@imeitrack.app"
SALES_EMAIL = "sales@imeitrack.app"


def wipe_database(db: Session) -> None:
    """Delete rows in FK-safe order."""
    db.execute(delete(ReturnRequest))
    db.execute(delete(SalesOrderItem))
    db.execute(delete(SalesOrder))
    db.execute(delete(Device))
    db.execute(delete(InventoryBatch))
    db.execute(delete(PurchaseOrderItem))
    db.execute(delete(PurchaseOrder))
    db.execute(delete(ProductModel))
    db.execute(delete(Customer))
    db.execute(delete(Supplier))
    db.execute(delete(User))
    db.commit()


def seed_users(db: Session) -> User:
    users = [
        User(
            full_name="Alex Rivera",
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(PASSWORD),
            role=UserRole.admin,
            is_active=True,
        ),
        User(
            full_name="Jordan Kim",
            email=INVENTORY_EMAIL,
            hashed_password=get_password_hash(PASSWORD),
            role=UserRole.inventory_manager,
            is_active=True,
        ),
        User(
            full_name="Sam Patel",
            email=SALES_EMAIL,
            hashed_password=get_password_hash(PASSWORD),
            role=UserRole.sales_manager,
            is_active=True,
        ),
    ]
    for u in users:
        db.add(u)
    db.flush()
    return users[0]


def seed_suppliers(db: Session) -> list[Supplier]:
    rows = [
        Supplier(
            name="Pacific Device Wholesale",
            contact_person="Chris Wong",
            email="orders@pacificdw.example.com",
            phone="+1 415 555 0101",
            address="1200 Market St, San Francisco, CA",
            supplier_type=SupplierType.distributor,
            payment_terms="Net 30",
            is_active=True,
            notes="Primary Apple / Samsung distributor.",
        ),
        Supplier(
            name="Atlantic Mobile Supply",
            contact_person="Maria Santos",
            email="sales@atlanticms.example.com",
            phone="+1 212 555 0142",
            address="88 Canal St, New York, NY",
            supplier_type=SupplierType.wholesaler,
            payment_terms="Net 15",
            is_active=True,
        ),
        Supplier(
            name="Great Lakes GSM",
            contact_person="David Chen",
            email="procurement@glgsm.example.com",
            phone="+1 312 555 0199",
            address="450 N Michigan Ave, Chicago, IL",
            supplier_type=SupplierType.broker,
            payment_terms="COD / Net 7",
            is_active=True,
        ),
        Supplier(
            name="Sunbelt Refurbishers",
            contact_person="Tanya Brooks",
            email="bulk@sunbeltref.example.com",
            phone="+1 602 555 0177",
            address="2200 E Camelback Rd, Phoenix, AZ",
            supplier_type=SupplierType.wholesaler,
            payment_terms="Net 30",
            is_active=True,
        ),
        Supplier(
            name="Nordic Parts Co.",
            contact_person="Erik Lindqvist",
            email="export@nordicparts.example.com",
            phone="+46 8 555 0100",
            address="Stockholm, SE (US forwarding)",
            supplier_type=SupplierType.manufacturer,
            payment_terms="Wire / Net 45",
            is_active=True,
        ),
    ]
    for s in rows:
        db.add(s)
    db.flush()
    return rows


def seed_customers(db: Session) -> list[Customer]:
    rows = [
        Customer(
            business_name="Metro Cellular Wholesale",
            contact_person="James O'Neil",
            email="buying@metrocw.example.com",
            phone="+1 617 555 0120",
            billing_address="500 Boylston St, Boston, MA 02116",
            shipping_address="Warehouse 4, 500 Boylston St, Boston, MA 02116",
            credit_limit=Decimal("250000.00"),
            outstanding_balance=Decimal("12450.00"),
            is_active=True,
            notes="Prefers Grade A inventory.",
        ),
        Customer(
            business_name="Sunrise Phone Distributors",
            contact_person="Priya Sharma",
            email="orders@sunrisepd.example.com",
            phone="+1 305 555 0166",
            billing_address="1 Biscayne Blvd, Miami, FL 33132",
            shipping_address="1 Biscayne Blvd, Miami, FL 33132",
            credit_limit=Decimal("180000.00"),
            outstanding_balance=Decimal("0.00"),
            is_active=True,
        ),
        Customer(
            business_name="Rocky Mountain Wireless",
            contact_person="Ben Carter",
            email="procurement@rmwireless.example.com",
            phone="+1 303 555 0188",
            billing_address="1700 Broadway, Denver, CO 80290",
            shipping_address="1700 Broadway, Denver, CO 80290",
            credit_limit=Decimal("95000.00"),
            outstanding_balance=Decimal("3200.00"),
            is_active=True,
        ),
        Customer(
            business_name="Bay Area Resellers LLC",
            contact_person="Linda Nguyen",
            email="ap@bayarearesellers.example.com",
            phone="+1 510 555 0134",
            billing_address="2000 Powell St, Emeryville, CA 94608",
            shipping_address="2000 Powell St, Emeryville, CA 94608",
            credit_limit=Decimal("120000.00"),
            outstanding_balance=Decimal("8900.00"),
            is_active=True,
        ),
        Customer(
            business_name="Lone Star Mobile Outlet",
            contact_person="Marcus Webb",
            email="buyer@lonestarmo.example.com",
            phone="+1 214 555 0155",
            billing_address="400 Commerce St, Dallas, TX 75201",
            shipping_address="400 Commerce St, Dallas, TX 75201",
            credit_limit=Decimal("60000.00"),
            outstanding_balance=Decimal("0.00"),
            is_active=True,
        ),
    ]
    for c in rows:
        db.add(c)
    db.flush()
    return rows


def seed_product_models(db: Session) -> list[ProductModel]:
    specs = [
        ("Apple", "iPhone 15", "128GB", "Black"),
        ("Apple", "iPhone 15", "256GB", "Blue"),
        ("Apple", "iPhone 14", "128GB", "Midnight"),
        ("Samsung", "Galaxy S24", "256GB", "Onyx Black"),
        ("Samsung", "Galaxy A54", "128GB", "Awesome Graphite"),
        ("Google", "Pixel 8", "128GB", "Obsidian"),
        ("Google", "Pixel 7a", "128GB", "Charcoal"),
        ("Motorola", "moto g stylus 5G", "256GB", "Meteor Grey"),
        ("OnePlus", "12", "256GB", "Silky Black"),
        ("Apple", "iPhone 13", "128GB", "Starlight"),
    ]
    rows: list[ProductModel] = []
    for brand, model, storage, color in specs:
        pm = ProductModel(
            brand=brand,
            model_name=model,
            storage=storage,
            color=color,
            default_condition_type="refurbished",
        )
        db.add(pm)
        rows.append(pm)
    db.flush()
    return rows


def seed_devices(db: Session, product_models: list[ProductModel], suppliers: list[Supplier]) -> list[Device]:
    """20 devices with unique 15-digit IMEIs (numeric-only)."""
    devices: list[Device] = []
    grades = (DeviceConditionGrade.A, DeviceConditionGrade.B, DeviceConditionGrade.A, DeviceConditionGrade.C)
    for i in range(20):
        pm = product_models[i % len(product_models)]
        sup = suppliers[i % len(suppliers)]
        imei = f"{351000000000000 + i:015d}"
        d = Device(
            product_model_id=pm.id,
            condition_grade=grades[i % len(grades)],
            battery_health=85 + (i % 11),
            lock_status=DeviceLockStatus.unlocked,
            imei=imei,
            purchase_cost=Decimal("380.00") + Decimal(i * 7),
            selling_price=Decimal("529.00") + Decimal(i * 9),
            status=DeviceStatus.available,
            supplier_id=sup.id,
        )
        db.add(d)
        devices.append(d)
    db.flush()
    return devices


def seed_purchase_orders(db: Session, admin: User, suppliers: list[Supplier]) -> list[PurchaseOrder]:
    payloads = [
        PurchaseOrderCreate(
            po_number="PO-2026-SEED-001",
            supplier_id=suppliers[0].id,
            status=PurchaseOrderStatus.received,
            expected_delivery_date=date(2026, 2, 15),
            notes="Inbound iPhone 15 / 14 mix — received and inspected.",
            items=[
                PurchaseOrderItemCreate(
                    brand="Apple",
                    model_name="iPhone 15",
                    storage="128GB",
                    color="Black",
                    expected_quantity=12,
                    unit_cost=Decimal("640.00"),
                ),
                PurchaseOrderItemCreate(
                    brand="Apple",
                    model_name="iPhone 14",
                    storage="128GB",
                    color="Midnight",
                    expected_quantity=8,
                    unit_cost=Decimal("520.00"),
                ),
            ],
        ),
        PurchaseOrderCreate(
            po_number="PO-2026-SEED-002",
            supplier_id=suppliers[1].id,
            status=PurchaseOrderStatus.ordered,
            expected_delivery_date=date(2026, 4, 1),
            notes="Samsung S24 + Pixel 8 allocation.",
            items=[
                PurchaseOrderItemCreate(
                    brand="Samsung",
                    model_name="Galaxy S24",
                    storage="256GB",
                    color="Onyx Black",
                    expected_quantity=6,
                    unit_cost=Decimal("710.00"),
                ),
            ],
        ),
        PurchaseOrderCreate(
            po_number="PO-2026-SEED-003",
            supplier_id=suppliers[3].id,
            status=PurchaseOrderStatus.draft,
            expected_delivery_date=date(2026, 5, 10),
            notes="Refurbished mid-tier — pending supplier confirmation.",
            items=[
                PurchaseOrderItemCreate(
                    brand="Motorola",
                    model_name="moto g stylus 5G",
                    storage="256GB",
                    color="Meteor Grey",
                    expected_quantity=20,
                    unit_cost=Decimal("185.00"),
                ),
            ],
        ),
    ]
    out: list[PurchaseOrder] = []
    for p in payloads:
        out.append(po_svc.create_purchase_order(db, p, created_by=admin.id))
    return out


def seed_inventory_batch(
    db: Session,
    admin: User,
    supplier: Supplier,
    purchase_order: PurchaseOrder,
    device_ids: list[int],
) -> None:
    """Link first five devices to a receiving batch (in_stock)."""
    batch = InventoryBatch(
        batch_code="BATCH-RCV-2026-SEED-01",
        supplier_id=supplier.id,
        purchase_order_id=purchase_order.id,
        received_date=date(2026, 2, 18),
        total_received=5,
        notes="First receiving wave from PO-2026-SEED-001 (seed).",
        created_by=admin.id,
    )
    db.add(batch)
    db.flush()
    for did in device_ids[:5]:
        d = db.get(Device, did)
        if d is None:
            raise RuntimeError(f"Device {did} not found")
        d.source_batch_id = batch.id
        d.status = DeviceStatus.in_stock
        db.add(d)
    db.commit()


def seed_sales_orders_and_returns(
    db: Session,
    sales_user: User,
    customers: list[Customer],
    device_ids: list[int],
) -> None:
    """
    SO1: 4 devices → shipped (sold). SO2: 3 devices → delivered (sold). SO3: 2 devices → confirmed (reserved).
    Then 2 return requests on one device from SO1 and one from SO2.
    """
    # SO1
    so1_payload = SalesOrderCreate(
        order_number="SO-2026-SEED-001",
        customer_id=customers[0].id,
        status=SalesOrderStatus.draft,
        notes="Wholesale order — Metro Cellular.",
    )
    so1 = so_svc.create_sales_order(db, so1_payload, created_by=sales_user.id)
    dev_ids_1 = device_ids[0:4]
    so_svc.bulk_add_devices_to_sales_order(
        db,
        so1.id,
        [
            SalesOrderItemAdd(device_id=dev_ids_1[0], selling_price=Decimal("649.00")),
            SalesOrderItemAdd(device_id=dev_ids_1[1], selling_price=Decimal("659.00")),
            SalesOrderItemAdd(device_id=dev_ids_1[2], selling_price=Decimal("639.00")),
            SalesOrderItemAdd(device_id=dev_ids_1[3], selling_price=Decimal("669.00")),
        ],
    )
    so1 = db.get(SalesOrder, so1.id)
    assert so1 is not None
    so_svc.update_sales_order_status(db, so1, SalesOrderStatusUpdate(status=SalesOrderStatus.shipped))

    # SO2
    so2_payload = SalesOrderCreate(
        order_number="SO-2026-SEED-002",
        customer_id=customers[1].id,
        status=SalesOrderStatus.draft,
        notes="Sunrise — mixed Samsung / Google.",
    )
    so2 = so_svc.create_sales_order(db, so2_payload, created_by=sales_user.id)
    dev_ids_2 = device_ids[4:7]
    so_svc.bulk_add_devices_to_sales_order(
        db,
        so2.id,
        [
            SalesOrderItemAdd(device_id=dev_ids_2[0], selling_price=Decimal("729.00")),
            SalesOrderItemAdd(device_id=dev_ids_2[1], selling_price=Decimal("579.00")),
            SalesOrderItemAdd(device_id=dev_ids_2[2], selling_price=Decimal("599.00")),
        ],
    )
    so2 = db.get(SalesOrder, so2.id)
    assert so2 is not None
    so_svc.update_sales_order_status(db, so2, SalesOrderStatusUpdate(status=SalesOrderStatus.delivered))

    # SO3 — stays confirmed, devices reserved
    so3_payload = SalesOrderCreate(
        order_number="SO-2026-SEED-003",
        customer_id=customers[2].id,
        status=SalesOrderStatus.draft,
        notes="Rocky Mountain — pending pickup.",
    )
    so3 = so_svc.create_sales_order(db, so3_payload, created_by=sales_user.id)
    dev_ids_3 = device_ids[7:9]
    so_svc.bulk_add_devices_to_sales_order(
        db,
        so3.id,
        [
            SalesOrderItemAdd(device_id=dev_ids_3[0], selling_price=Decimal("549.00")),
            SalesOrderItemAdd(device_id=dev_ids_3[1], selling_price=Decimal("559.00")),
        ],
    )
    so3 = db.get(SalesOrder, so3.id)
    assert so3 is not None
    so_svc.update_sales_order_status(db, so3, SalesOrderStatusUpdate(status=SalesOrderStatus.confirmed))

    # Returns (requires shipped/delivered + sold devices)
    rma_svc.create_return_request(
        db,
        ReturnRequestCreate(
            sales_order_id=so1.id,
            device_id=dev_ids_1[0],
            reason="Dead pixel cluster on display",
            issue_description="Customer reports bright spots after 48h. Request RMA credit.",
        ),
    )
    rma_svc.create_return_request(
        db,
        ReturnRequestCreate(
            sales_order_id=so2.id,
            device_id=dev_ids_2[0],
            reason="Battery drain higher than spec",
            issue_description="Device loses ~25% overnight idle. Request inspection.",
        ),
    )


def run_seed(force: bool) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing and not force:
            print(
                "Seed skipped: users already present. Re-run with --force to wipe app tables and reseed.",
                file=sys.stderr,
            )
            return

        if force:
            print("Wiping application tables…")
            wipe_database(db)

        print("Seeding users…")
        admin = seed_users(db)
        db.commit()
        db.refresh(admin)

        sales_user = db.query(User).filter(User.email == SALES_EMAIL).one()

        print("Seeding suppliers, customers, product models…")
        suppliers = seed_suppliers(db)
        customers = seed_customers(db)
        product_models = seed_product_models(db)
        db.commit()

        print("Seeding 20 devices…")
        seed_devices(db, product_models, suppliers)
        db.flush()
        device_ids = [d.id for d in db.query(Device).order_by(Device.id).limit(20).all()]
        if len(device_ids) != 20:
            raise RuntimeError(f"Expected 20 devices, got {len(device_ids)}")
        db.commit()

        print("Seeding purchase orders…")
        pos = seed_purchase_orders(db, admin, suppliers)

        print("Seeding inventory batch + linking first 5 devices…")
        seed_inventory_batch(db, admin, suppliers[0], pos[0], device_ids)

        print("Seeding sales orders and return requests…")
        seed_sales_orders_and_returns(db, sales_user, customers, device_ids)

        print()
        print("Done.")
        print("  Users (password for all):", PASSWORD)
        print(f"    - {ADMIN_EMAIL} (admin)")
        print(f"    - {INVENTORY_EMAIL} (inventory_manager)")
        print(f"    - {SALES_EMAIL} (sales_manager)")
        print(f"  Suppliers: {len(suppliers)}, Customers: {len(customers)}, Product models: {len(product_models)}")
        print("  Devices: 20 (9 on sales orders; 2 with open returns; remainder available/in_stock)")
        print("  Purchase orders: 3, Sales orders: 3, Return requests: 2")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed IMEITrack demo data.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete existing app data (users, inventory, orders, etc.) then seed.",
    )
    args = parser.parse_args()
    run_seed(force=args.force)


if __name__ == "__main__":
    main()
