from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import (
    FastAPI,
    Request,
)
from fastapi.exceptions import (
    RequestValidationError,
)
from fastapi.middleware.cors import (
    CORSMiddleware,
)
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.core.responses import success_response
from app.integrations.supabase_client import (
    get_supabase_manager,
)

settings = get_settings()

configure_logging(
    settings.log_level
)

logger = logging.getLogger(
    __name__
)


@asynccontextmanager
async def lifespan(
    app: FastAPI,
):
    logger.info(
        "Starting %s",
        settings.app_name,
    )

    logger.info(
        "Configuration: %s",
        settings.redacted,
    )

    yield

    logger.info(
        "Stopping %s",
        settings.app_name,
    )


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    docs_url=settings.docs_url,
    redoc_url=(
        "/redoc"
        if settings.docs_url
        else None
    ),
    openapi_url=(
        "/openapi.json"
        if settings.docs_url
        else None
    ),
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(
    request: Request,
    call_next,
):
    request_id = (
        request.headers.get(
            settings.request_id_header
        )
        or str(uuid.uuid4())
    )

    started = time.perf_counter()

    request.state.request_id = request_id

    try:
        response = await call_next(
            request
        )

    except Exception:
        logger.exception(
            "Unhandled request error: %s %s",
            request.method,
            request.url.path,
        )
        raise

    duration_ms = (
        time.perf_counter()
        - started
    ) * 1000

    response.headers[
        settings.request_id_header
    ] = request_id

    response.headers[
        "X-Process-Time-ms"
    ] = f"{duration_ms:.2f}"

    return response


@app.exception_handler(AppError)
async def app_error_handler(
    request: Request,
    exc: AppError,
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "code": exc.code,
            "details": exc.details,
            "request_id": getattr(
                request.state,
                "request_id",
                None,
            ),
        },
    )


@app.exception_handler(
    RequestValidationError
)
async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Request validation failed.",
            "code": "VALIDATION_ERROR",
            "details": exc.errors(),
            "request_id": getattr(
                request.state,
                "request_id",
                None,
            ),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(
        "Unhandled application exception",
        exc_info=exc,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error.",
            "code": "INTERNAL_SERVER_ERROR",
            "details": None,
            "request_id": getattr(
                request.state,
                "request_id",
                None,
            ),
        },
    )


@app.get(
    "/health",
    tags=["Health"],
)
def health():
    return success_response(
        data={
            "status": "ok",
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
        },
        message="Service is healthy.",
    )


@app.get(
    "/ready",
    tags=["Health"],
)
def readiness():
    health_status = (
        get_supabase_manager()
        .healthcheck()
    )

    ready = health_status.get(
        "reachable",
        False,
    )

    return success_response(
        data={
            "status": (
                "ready"
                if ready
                else "degraded"
            ),
            "supabase":
                health_status,
        },
        message=(
            "Readiness check completed."
        ),
    )


app.include_router(
    api_router,
    prefix=settings.api_v1_prefix,
)