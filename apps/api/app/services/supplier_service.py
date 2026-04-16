from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate


def create_supplier(db: Session, payload: SupplierCreate) -> Supplier:
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def list_suppliers(db: Session, search: str | None = None, active_only: bool = False) -> list[Supplier]:
    query = db.query(Supplier)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Supplier.name.ilike(search_term),
                Supplier.email.ilike(search_term),
            )
        )
    if active_only:
        query = query.filter(Supplier.is_active.is_(True))
    return query.order_by(Supplier.created_at.desc()).all()


def get_supplier_by_id(db: Session, supplier_id: int) -> Supplier | None:
    return db.get(Supplier, supplier_id)


def update_supplier(db: Session, supplier: Supplier, payload: SupplierUpdate) -> Supplier:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def deactivate_supplier(db: Session, supplier: Supplier) -> Supplier:
    supplier.is_active = False
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier
