from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.http_exceptions import bad_request, not_found
from app.db.session import get_db
from app.models.return_request import ReturnRequestStatus
from app.schemas.return_request import (
    ReturnRequestCreate,
    ReturnRequestReadDetailed,
    ReturnRequestStatusUpdate,
)
from app.services import return_request_service as rma_svc

router = APIRouter(prefix="/return-requests", tags=["return-requests"])


@router.post("", response_model=ReturnRequestReadDetailed, status_code=status.HTTP_201_CREATED)
def create_return_request(
    payload: ReturnRequestCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "sales_manager", "inventory_manager")),
) -> ReturnRequestReadDetailed:
    try:
        ret = rma_svc.create_return_request(db, payload)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    loaded = rma_svc.get_return_request_by_id(db, ret.id)
    assert loaded is not None
    return ReturnRequestReadDetailed.model_validate(loaded)


@router.get("", response_model=list[ReturnRequestReadDetailed])
def list_return_requests(
    status_filter: ReturnRequestStatus | None = Query(default=None, alias="status"),
    sales_order_id: int | None = Query(default=None),
    device_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[ReturnRequestReadDetailed]:
    rows = rma_svc.list_return_requests(
        db,
        status=status_filter,
        sales_order_id=sales_order_id,
        device_id=device_id,
    )
    return [ReturnRequestReadDetailed.model_validate(r) for r in rows]


@router.get("/{return_id}", response_model=ReturnRequestReadDetailed)
def get_return_request(
    return_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> ReturnRequestReadDetailed:
    ret = rma_svc.get_return_request_by_id(db, return_id)
    if ret is None:
        raise not_found("Return request")
    return ReturnRequestReadDetailed.model_validate(ret)


@router.patch("/{return_id}/status", response_model=ReturnRequestReadDetailed)
def update_return_status(
    return_id: int,
    payload: ReturnRequestStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "inventory_manager")),
) -> ReturnRequestReadDetailed:
    ret = rma_svc.get_return_request_by_id(db, return_id)
    if ret is None:
        raise not_found("Return request")
    ret = rma_svc.update_return_status(db, ret, payload)
    loaded = rma_svc.get_return_request_by_id(db, ret.id)
    assert loaded is not None
    return ReturnRequestReadDetailed.model_validate(loaded)
