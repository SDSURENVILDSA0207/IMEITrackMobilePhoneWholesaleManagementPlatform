from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router
from app.api.routes.customers import router as customers_router
from app.api.routes.devices import router as devices_router
from app.api.routes.health import router as health_router
from app.api.routes.inventory_intake import router as inventory_intake_router
from app.api.routes.product_models import router as product_models_router
from app.api.routes.protected import router as protected_router
from app.api.routes.purchase_orders import router as purchase_orders_router
from app.api.routes.return_requests import router as return_requests_router
from app.api.routes.sales_orders import router as sales_orders_router
from app.api.routes.suppliers import router as suppliers_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

import app.models  # noqa: F401 — register all ORM models on Base.metadata


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=f"{settings.api_v1_prefix}/docs",
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix=settings.api_v1_prefix)
    app.include_router(auth_router, prefix=settings.api_v1_prefix)
    app.include_router(analytics_router, prefix=settings.api_v1_prefix)
    app.include_router(protected_router, prefix=settings.api_v1_prefix)
    app.include_router(suppliers_router, prefix=settings.api_v1_prefix)
    app.include_router(customers_router, prefix=settings.api_v1_prefix)
    app.include_router(product_models_router, prefix=settings.api_v1_prefix)
    app.include_router(devices_router, prefix=settings.api_v1_prefix)
    app.include_router(inventory_intake_router, prefix=settings.api_v1_prefix)
    app.include_router(purchase_orders_router, prefix=settings.api_v1_prefix)
    app.include_router(sales_orders_router, prefix=settings.api_v1_prefix)
    app.include_router(return_requests_router, prefix=settings.api_v1_prefix)

    @app.get("/", tags=["meta"])
    def root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "api_prefix": settings.api_v1_prefix,
            "docs": f"{settings.api_v1_prefix}/docs",
        }

    @app.on_event("startup")
    def create_tables() -> None:
        # Production should rely on Alembic migrations; avoid implicit DDL in prod.
        if settings.app_env.lower() == "development":
            Base.metadata.create_all(bind=engine)

    return app


app = create_app()
