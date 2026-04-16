from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class CopilotSeverity(str, Enum):
    info = "info"
    warning = "warning"
    danger = "danger"


class CopilotItem(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=200)
    detail: str = Field(min_length=1, max_length=800)
    severity: CopilotSeverity = CopilotSeverity.info
    metric: str | None = Field(default=None, max_length=80)
    action_label: str | None = Field(default=None, max_length=80)
    action_path: str | None = Field(default=None, max_length=200)


class CopilotProductSnippet(BaseModel):
    product_model_id: int
    label: str = Field(min_length=1, max_length=200)
    units: int


class CopilotSupplierSnippet(BaseModel):
    supplier_id: int
    name: str = Field(min_length=1, max_length=255)
    purchase_orders_30d: int


class CopilotSalesTrend(BaseModel):
    window_days: int = Field(ge=1, le=365)
    current_units: int
    previous_units: int
    change_pct: float | None = None


class CopilotOverview(BaseModel):
    generated_at: datetime
    summary: str = Field(min_length=1, max_length=1200)
    alerts: list[CopilotItem] = Field(default_factory=list)
    insights: list[CopilotItem] = Field(default_factory=list)
    suggestions: list[CopilotItem] = Field(default_factory=list)
    best_sellers: list[CopilotProductSnippet] = Field(default_factory=list)
    slow_movers: list[CopilotProductSnippet] = Field(default_factory=list)
    supplier_activity: list[CopilotSupplierSnippet] = Field(default_factory=list)
    sales_trend: CopilotSalesTrend | None = None
