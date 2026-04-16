from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.entities import Device, InventoryMovement

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total_devices = db.query(func.count(Device.id)).scalar()
    available_devices = db.query(func.count(Device.id)).filter(Device.status == "available").scalar()
    sold_devices = db.query(func.count(Device.id)).filter(Device.status == "sold").scalar()
    total_movements = db.query(func.count(InventoryMovement.id)).scalar()
    return {
        "total_devices": total_devices,
        "available_devices": available_devices,
        "sold_devices": sold_devices,
        "total_movements": total_movements,
    }
