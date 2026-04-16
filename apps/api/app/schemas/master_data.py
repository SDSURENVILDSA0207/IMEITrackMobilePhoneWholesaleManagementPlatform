from pydantic import BaseModel


class SupplierCreate(BaseModel):
    code: str
    name: str
    contact_info: str | None = None
    payment_terms: str | None = None


class CustomerCreate(BaseModel):
    code: str
    name: str
    contact_info: str | None = None
    credit_limit: float | None = None


class DeviceModelCreate(BaseModel):
    brand: str
    model_name: str
    storage: str | None = None
    color: str | None = None
    grade: str | None = None
