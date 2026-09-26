from fastapi import APIRouter, Depends
from app.core.responses import success_response
from app.dependencies import get_current_user
from app.security.auth import CurrentUser
router=APIRouter(prefix="/profile", tags=["Profile"])
@router.get("")
def get_profile(user: CurrentUser = Depends(get_current_user)):
    return success_response(data={"id":user.id,"email":user.email,"role":user.role.value,"warehouse_id":user.warehouse_id,"permissions":sorted(user.permissions)})
