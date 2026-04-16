from pydantic import Field

from app.schemas.base import SchemaModel, TimestampReadSchema


class ProductModelCreate(SchemaModel):
    brand: str = Field(min_length=1, max_length=100)
    model_name: str = Field(min_length=1, max_length=150)
    storage: str = Field(min_length=1, max_length=50)
    color: str = Field(min_length=1, max_length=50)
    default_condition_type: str | None = Field(default=None, max_length=20)


class ProductModelUpdate(SchemaModel):
    brand: str | None = Field(default=None, min_length=1, max_length=100)
    model_name: str | None = Field(default=None, min_length=1, max_length=150)
    storage: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = Field(default=None, min_length=1, max_length=50)
    default_condition_type: str | None = Field(default=None, max_length=20)


class ProductModelRead(TimestampReadSchema):
    id: int
    brand: str
    model_name: str
    storage: str
    color: str
    default_condition_type: str | None
