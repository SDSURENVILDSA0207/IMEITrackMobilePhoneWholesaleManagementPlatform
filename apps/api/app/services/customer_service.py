from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def list_customers(
    db: Session,
    search: str | None = None,
    active_only: bool = False,
) -> list[Customer]:
    query = db.query(Customer)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.business_name.ilike(search_term),
                Customer.email.ilike(search_term),
            )
        )
    if active_only:
        query = query.filter(Customer.is_active.is_(True))
    return query.order_by(Customer.created_at.desc()).all()


def get_customer_by_id(db: Session, customer_id: int) -> Customer | None:
    return db.get(Customer, customer_id)


def update_customer(db: Session, customer: Customer, payload: CustomerUpdate) -> Customer:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def deactivate_customer(db: Session, customer: Customer) -> Customer:
    customer.is_active = False
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
