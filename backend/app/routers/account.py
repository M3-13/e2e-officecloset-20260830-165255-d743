"""Account routes: self-service account deletion.

Deleting an account removes the current user together with all of their
clothing items and outfits (via the ``cascade="all, delete-orphan"``
relationships on ``User``) and the uploaded image files from the upload
directory. The endpoint answers 204 with no body on success.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Item, User

logger = logging.getLogger(__name__)

router = APIRouter()


def _image_urls(user_id: int, db: Session) -> list[str]:
    """Return the ``image_url`` of every item owned by ``user_id``."""
    return list(db.scalars(select(Item.image_url).where(Item.owner_id == user_id)).all())


def _delete_image_files(image_urls: list[str], upload_dir: str) -> None:
    """Delete the on-disk files referenced by ``image_urls``.

    Each ``image_url`` is a path relative to the upload directory. The lookup
    is deliberately defensive: a leading slash or an ``uploads/`` segment is
    stripped, and a resolved path is only removed when it actually lives inside
    ``upload_dir`` (never a path-traversal escape). File removal is best-effort
    and never fails the request.
    """
    root = Path(upload_dir).resolve()
    for image_url in image_urls:
        if not image_url:
            continue
        relative = image_url.lstrip("/\\")
        parts = Path(relative).parts
        if parts and parts[0] == root.name:
            relative = str(Path(*parts[1:]))
        try:
            target = (root / relative).resolve()
        except (OSError, ValueError):
            continue
        if not str(target).startswith(str(root)):
            continue
        try:
            if target.is_file():
                target.unlink()
        except OSError:
            logger.warning("could not delete image file %s", target, exc_info=True)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    image_urls = _image_urls(user.id, db)

    db.delete(user)
    db.commit()

    _delete_image_files(image_urls, settings.upload_dir)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
