from decimal import Decimal

from pydantic import EmailStr, Field

from app.schemas.base import SchemaModel, TimestampReadSchema


class CustomerCreate(SchemaModel):
    business_name: str = Field(min_length=2, max_length=255)
    contact_person: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    billing_address: str | None = None
    shipping_address: str | None = None
    credit_limit: Decimal | None = None
    outstanding_balance: Decimal | None = Field(default=0)
    is_active: bool = True
    notes: str | None = None


class CustomerUpdate(SchemaModel):
    business_name: str | None = Field(default=None, min_length=2, max_length=255)
    contact_person: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    billing_address: str | None = None
    shipping_address: str | None = None
    credit_limit: Decimal | None = None
    outstanding_balance: Decimal | None = None
    is_active: bool | None = None
    notes: str | None = None


class CustomerRead(TimestampReadSchema):
    id: int
    business_name: str
    contact_person: str | None
    email: EmailStr | None
    phone: str | None
    billing_address: str | None
    shipping_address: str | None
    credit_limit: Decimal | None
    outstanding_balance: Decimal | None
    is_active: bool
    notes: str | None
