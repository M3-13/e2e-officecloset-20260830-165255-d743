"""Local image storage: validate, save, replace and delete uploaded images.

Images are stored on disk under ``UPLOAD_DIR``, one file per item named
``<item_id>.<ext>``. Validation enforces the agreed content types
(JPEG/PNG/WebP, detected by magic bytes rather than by trusting the client's
declared type) and a maximum size of ``MAX_UPLOAD_SIZE`` bytes. The size check
here is defence-in-depth: the primary gate is ``RequestSizeLimitMiddleware``,
which rejects an oversized body before it is ever read.
"""

import logging
from contextlib import suppress
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

# Canonical content type -> file extension written to disk.
CONTENT_TYPE_EXTENSION: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# File extension on disk -> content type served by GET /api/items/{id}/image.
EXTENSION_CONTENT_TYPE: dict[str, str] = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class InvalidImageError(ValueError):
    """Raised when uploaded bytes are not a supported, valid image."""


def _upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _detect_content_type(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_image(data: bytes) -> str:
    """Validate image bytes and return the detected content type.

    Raises ``InvalidImageError`` for empty, oversized or unsupported content.
    """
    if not data:
        raise InvalidImageError("Bild ist leer")

    if len(data) > settings.max_upload_size:
        raise InvalidImageError(
            f"Bild überschreitet die maximale Größe von {settings.max_upload_size} Bytes"
        )

    content_type = _detect_content_type(data)
    if content_type is None:
        raise InvalidImageError("Ungültiges Bildformat: erlaubt sind JPEG, PNG und WebP")

    return content_type


def _item_files(item_id: int) -> list[Path]:
    return sorted(_upload_dir().glob(f"{item_id}.*"))


def save_image(item_id: int, data: bytes, content_type: str) -> str:
    """Persist image bytes for ``item_id`` and return the served image URL."""
    ext = CONTENT_TYPE_EXTENSION[content_type]
    (_upload_dir() / f"{item_id}{ext}").write_bytes(data)
    return f"/api/items/{item_id}/image"


def replace_image(item_id: int, data: bytes, content_type: str) -> str:
    """Remove any existing image for ``item_id`` and store the new one."""
    delete_image(item_id)
    return save_image(item_id, data, content_type)


def delete_image(item_id: int) -> None:
    """Delete every stored image file for ``item_id``, if any."""
    for path in _item_files(item_id):
        with suppress(FileNotFoundError):
            path.unlink()


def load_image(item_id: int) -> tuple[bytes, str] | None:
    """Return ``(bytes, content_type)`` for ``item_id``'s image, or ``None``."""
    files = _item_files(item_id)
    if not files:
        return None
    path = files[0]
    content_type = EXTENSION_CONTENT_TYPE.get(path.suffix, "application/octet-stream")
    return path.read_bytes(), content_type
