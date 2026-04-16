from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.http_exceptions import not_found
from app.db.session import get_db
from app.schemas.product_model import ProductModelCreate, ProductModelRead, ProductModelUpdate
from app.services.product_model_service import (
    create_product_model,
    delete_product_model,
    get_product_model_by_id,
    list_product_models,
    update_product_model,
)

router = APIRouter(prefix="/product-models", tags=["product-models"])


@router.post("", response_model=ProductModelRead, status_code=status.HTTP_201_CREATED)
def create_product_model_endpoint(
    payload: ProductModelCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> ProductModelRead:
    product_model = create_product_model(db, payload)
    return ProductModelRead.model_validate(product_model)


@router.get("", response_model=list[ProductModelRead])
def list_product_models_endpoint(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[ProductModelRead]:
    product_models = list_product_models(db)
    return [ProductModelRead.model_validate(item) for item in product_models]


@router.get("/{product_model_id}", response_model=ProductModelRead)
def get_product_model_endpoint(
    product_model_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> ProductModelRead:
    product_model = get_product_model_by_id(db, product_model_id)
    if product_model is None:
        raise not_found("Product model")
    return ProductModelRead.model_validate(product_model)


@router.put("/{product_model_id}", response_model=ProductModelRead)
def update_product_model_endpoint(
    product_model_id: int,
    payload: ProductModelUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> ProductModelRead:
    product_model = get_product_model_by_id(db, product_model_id)
    if product_model is None:
        raise not_found("Product model")
    product_model = update_product_model(db, product_model, payload)
    return ProductModelRead.model_validate(product_model)


@router.delete("/{product_model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_model_endpoint(
    product_model_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> None:
    product_model = get_product_model_by_id(db, product_model_id)
    if product_model is None:
        raise not_found("Product model")
    delete_product_model(db, product_model)
