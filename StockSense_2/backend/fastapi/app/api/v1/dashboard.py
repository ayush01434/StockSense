from fastapi import APIRouter
from app.core.responses import success_response
router=APIRouter(prefix="/dashboard", tags=["Dashboard"])
@router.get("")
def dashboard(): return success_response(data={})
