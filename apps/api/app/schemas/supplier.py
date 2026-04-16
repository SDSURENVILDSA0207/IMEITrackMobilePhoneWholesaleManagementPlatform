from pydantic import EmailStr, Field

from app.schemas.base import SchemaModel, TimestampReadSchema
from app.models.supplier import SupplierType


class SupplierCreate(SchemaModel):
    name: str = Field(min_length=2, max_length=255)
    contact_person: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    supplier_type: SupplierType = SupplierType.wholesaler
    payment_terms: str | None = Field(default=None, max_length=120)
    is_active: bool = True
    notes: str | None = None


class SupplierUpdate(SchemaModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    contact_person: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    supplier_type: SupplierType | None = None
    payment_terms: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None
    notes: str | None = None


class SupplierRead(TimestampReadSchema):
    id: int
    name: str
    contact_person: str | None
    email: EmailStr | None
    phone: str | None
    address: str | None
    supplier_type: SupplierType
    payment_terms: str | None
    is_active: bool
    notes: str | None
