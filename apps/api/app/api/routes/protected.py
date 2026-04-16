from fastapi import APIRouter, Depends

from app.api.deps import require_roles

router = APIRouter(prefix="/protected", tags=["protected"])


@router.get("/admin-only")
def admin_only(_=Depends(require_roles("admin"))) -> dict[str, str]:
    return {"message": "This is a protected admin route."}
