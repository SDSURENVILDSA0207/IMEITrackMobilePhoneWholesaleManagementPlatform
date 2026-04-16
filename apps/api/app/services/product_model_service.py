from sqlalchemy.orm import Session

from app.models.product_model import ProductModel
from app.schemas.product_model import ProductModelCreate, ProductModelUpdate


def create_product_model(db: Session, payload: ProductModelCreate) -> ProductModel:
    product_model = ProductModel(**payload.model_dump())
    db.add(product_model)
    db.commit()
    db.refresh(product_model)
    return product_model


def list_product_models(db: Session) -> list[ProductModel]:
    return db.query(ProductModel).order_by(ProductModel.created_at.desc()).all()


def get_product_model_by_id(db: Session, product_model_id: int) -> ProductModel | None:
    return db.get(ProductModel, product_model_id)


def update_product_model(
    db: Session,
    product_model: ProductModel,
    payload: ProductModelUpdate,
) -> ProductModel:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product_model, field, value)
    db.add(product_model)
    db.commit()
    db.refresh(product_model)
    return product_model


def delete_product_model(db: Session, product_model: ProductModel) -> None:
    db.delete(product_model)
    db.commit()
