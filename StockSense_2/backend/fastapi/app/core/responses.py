from __future__ import annotations

from math import ceil
from typing import Any


def success_response(*, data: Any = None, message: str = "OK") -> dict[str, Any]:
    return {"success": True, "message": message, "data": data}


def paginated_response(data: list[Any], *, page: int, page_size: int, total: int, message: str = "OK") -> dict[str, Any]:
    pages = ceil(total / page_size) if page_size else 0
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": pages,
            "has_next": page < pages,
            "has_previous": page > 1,
        },
    }
