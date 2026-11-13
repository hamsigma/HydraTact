from app.core.config import settings
from app.core.db import (
    check_db_health,
    close_db_pool,
    get_db_connection,
    get_db_pool,
    init_db_pool,
)
from app.core.exceptions import (
    EntityNotFoundException,
    HapticHoldTooShortException,
    HydraTactException,
    InvalidFSMTransitionException,
    RateLimitExceededException,
    SpatialValidationException,
    UnauthorizedOperationException,
    general_exception_handler,
    http_exception_handler,
    hydratact_exception_handler,
    validation_exception_handler,
)

__all__ = [
    "settings",
    "init_db_pool",
    "close_db_pool",
    "get_db_pool",
    "get_db_connection",
    "check_db_health",
    "HydraTactException",
    "SpatialValidationException",
    "EntityNotFoundException",
    "InvalidFSMTransitionException",
    "HapticHoldTooShortException",
    "UnauthorizedOperationException",
    "RateLimitExceededException",
    "hydratact_exception_handler",
    "validation_exception_handler",
    "http_exception_handler",
    "general_exception_handler",
]
