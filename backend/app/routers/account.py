"""Account routes: self-service account deletion.

Deleting an account removes the current user together with all of their
clothing items and outfits (via the ``cascade="all, delete-orphan"``
relationships on ``User``) and the uploaded image files (via
``storage.delete_image``). The endpoint answers 204 with no body on success.
"""

import logging

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import storage
from app.database import get_db
from app.deps import get_current_user
from app.models import Item, User

logger = logging.getLogger(__name__)

router = APIRouter()


def _owned_item_ids(db: Session, user_id: int) -> list[int]:
    """Return the ids of every item owned by ``user_id``."""
    return list(db.scalars(select(Item.id).where(Item.owner_id == user_id)).all())


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    item_ids = _owned_item_ids(db, user.id)

    db.delete(user)
    db.commit()

    for item_id in item_ids:
        try:
            storage.delete_image(item_id)
        except OSError:
            logger.warning("could not delete image file for item %s", item_id, exc_info=True)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
