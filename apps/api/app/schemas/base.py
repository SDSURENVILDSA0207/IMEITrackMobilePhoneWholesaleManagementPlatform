from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SchemaModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TimestampReadSchema(SchemaModel):
    created_at: datetime
    updated_at: datetime
