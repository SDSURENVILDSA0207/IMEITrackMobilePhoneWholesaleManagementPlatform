from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.http_exceptions import not_found
from app.db.session import get_db
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.services.customer_service import (
    create_customer,
    deactivate_customer,
    get_customer_by_id,
    list_customers,
    update_customer,
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post(
    "",
    response_model=CustomerRead,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_endpoint(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "sales_manager")),
) -> CustomerRead:
    customer = create_customer(db, payload)
    return CustomerRead.model_validate(customer)


@router.get("", response_model=list[CustomerRead])
def list_customers_endpoint(
    search: str | None = Query(default=None, description="Search by business name or email"),
    active_only: bool = Query(default=False, description="Only active customers"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[CustomerRead]:
    customers = list_customers(db, search=search, active_only=active_only)
    return [CustomerRead.model_validate(item) for item in customers]


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> CustomerRead:
    customer = get_customer_by_id(db, customer_id)
    if customer is None:
        raise not_found("Customer")
    return CustomerRead.model_validate(customer)


@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer_endpoint(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "sales_manager")),
) -> CustomerRead:
    customer = get_customer_by_id(db, customer_id)
    if customer is None:
        raise not_found("Customer")
    customer = update_customer(db, customer, payload)
    return CustomerRead.model_validate(customer)


@router.delete("/{customer_id}", response_model=CustomerRead)
def deactivate_customer_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "sales_manager")),
) -> CustomerRead:
    customer = get_customer_by_id(db, customer_id)
    if customer is None:
        raise not_found("Customer")
    customer = deactivate_customer(db, customer)
    return CustomerRead.model_validate(customer)
