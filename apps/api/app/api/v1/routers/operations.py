from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.entities import Device
from app.services.workflow_service import transition_device_state

router = APIRouter(tags=["operations"])


@router.post("/devices/{device_id}/reserve")
def reserve_device(device_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return transition_device_state(db, device, "reserved", "sales_order", None, current_user.id)


@router.post("/devices/{device_id}/sell")
def sell_device(device_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return transition_device_state(db, device, "sold", "sales_order", None, current_user.id)


@router.post("/devices/{device_id}/return")
def return_device(device_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return transition_device_state(db, device, "returned", "rma", None, current_user.id)
