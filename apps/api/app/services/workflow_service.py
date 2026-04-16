from sqlalchemy.orm import Session

from app.models.entities import Device, InventoryMovement


def transition_device_state(db: Session, device: Device, to_state: str, reference_type: str, reference_id: int | None, actor_id: int | None):
    previous_state = device.status
    device.status = to_state
    movement = InventoryMovement(
        device_id=device.id,
        movement_type=f"{previous_state}_to_{to_state}",
        from_state=previous_state,
        to_state=to_state,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=actor_id,
    )
    db.add(movement)
    db.commit()
    db.refresh(device)
    return device
