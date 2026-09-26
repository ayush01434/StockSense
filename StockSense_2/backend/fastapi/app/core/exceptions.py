from __future__ import annotations

from typing import Any


class AppError(Exception):
    def __init__(self, message: str, *, status_code: int = 400, code: str = "APP_ERROR", details: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details


class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: str | None = None):
        message = f"{resource} not found" + (f": {identifier}" if identifier else "")
        super().__init__(message, status_code=404, code="NOT_FOUND")


class ConflictError(AppError):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, status_code=409, code="CONFLICT", details=details)


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(message, status_code=401, code="UNAUTHORIZED")


class AuthorizationError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message, status_code=403, code="FORBIDDEN")


class ServiceUnavailableError(AppError):
    def __init__(self, message: str = "Required service is unavailable."):
        super().__init__(message, status_code=503, code="SERVICE_UNAVAILABLE")


class ValidationAppError(AppError):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, status_code=422, code="VALIDATION_ERROR", details=details)
