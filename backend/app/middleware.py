"""Request-size limiting middleware.

``RequestSizeLimitMiddleware`` inspects the ``Content-Length`` header and
answers ``413 Payload Too Large`` before the request body is read, so an
oversized upload is rejected cheaply instead of being buffered (AC-11). The
limit is read lazily from ``settings.max_upload_size`` so a test or deployment
can adjust it without touching the registered middleware instance.
"""

import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int | None = None) -> None:
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        limit = self.max_size if self.max_size is not None else settings.max_upload_size

        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                length = int(content_length)
            except ValueError:
                length = 0
            if length > limit:
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": (f"Bild überschreitet die maximale Größe von {limit} Bytes")
                    },
                )

        return await call_next(request)
