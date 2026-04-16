from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.http_exceptions import not_found
from app.db.session import get_db
from app.schemas.supplier import SupplierCreate, SupplierRead, SupplierUpdate
from app.services.supplier_service import (
    create_supplier,
    deactivate_supplier,
    get_supplier_by_id,
    list_suppliers,
    update_supplier,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post(
    "",
    response_model=SupplierRead,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier_endpoint(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> SupplierRead:
    supplier = create_supplier(db, payload)
    return SupplierRead.model_validate(supplier)


@router.get("", response_model=list[SupplierRead])
def list_suppliers_endpoint(
    search: str | None = Query(default=None, description="Search by supplier name or email"),
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[SupplierRead]:
    suppliers = list_suppliers(db, search=search, active_only=active_only)
    return [SupplierRead.model_validate(item) for item in suppliers]


@router.get("/{supplier_id}", response_model=SupplierRead)
def get_supplier_endpoint(
    supplier_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> SupplierRead:
    supplier = get_supplier_by_id(db, supplier_id)
    if supplier is None:
        raise not_found("Supplier")
    return SupplierRead.model_validate(supplier)


@router.put("/{supplier_id}", response_model=SupplierRead)
def update_supplier_endpoint(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> SupplierRead:
    supplier = get_supplier_by_id(db, supplier_id)
    if supplier is None:
        raise not_found("Supplier")
    supplier = update_supplier(db, supplier, payload)
    return SupplierRead.model_validate(supplier)


@router.delete("/{supplier_id}", response_model=SupplierRead)
def deactivate_supplier_endpoint(
    supplier_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> SupplierRead:
    supplier = get_supplier_by_id(db, supplier_id)
    if supplier is None:
        raise not_found("Supplier")
    supplier = deactivate_supplier(db, supplier)
    return SupplierRead.model_validate(supplier)
