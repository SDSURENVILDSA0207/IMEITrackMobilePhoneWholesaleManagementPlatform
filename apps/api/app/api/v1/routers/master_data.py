from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.entities import Customer, DeviceModel, Supplier
from app.repositories.crud import add_and_commit
from app.schemas.master_data import CustomerCreate, DeviceModelCreate, SupplierCreate

router = APIRouter(tags=["master-data"])


@router.get("/suppliers")
def list_suppliers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Supplier).order_by(Supplier.id.desc()).all()


@router.post("/suppliers")
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return add_and_commit(db, Supplier(**payload.model_dump()))


@router.get("/customers")
def list_customers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Customer).order_by(Customer.id.desc()).all()


@router.post("/customers")
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return add_and_commit(db, Customer(**payload.model_dump()))


@router.get("/device-models")
def list_device_models(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(DeviceModel).order_by(DeviceModel.id.desc()).all()


@router.post("/device-models")
def create_device_model(payload: DeviceModelCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return add_and_commit(db, DeviceModel(**payload.model_dump()))
