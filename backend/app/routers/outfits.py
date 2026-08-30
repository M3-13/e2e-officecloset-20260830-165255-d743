"""Outfit routes: create, list, read, update and delete a user's outfits.

Every outfit is strictly private: responses contain only the current user's
outfits, and an outfit or item owned by another user is answered with 404 so
existence is never leaked.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Item, Outfit, User
from app.schemas.outfits import OutfitCreate, OutfitOut, OutfitUpdate

router = APIRouter()


def _resolve_item_ids(db: Session, user_id: int, item_ids: list[int]) -> None:
    """Ensure every item id exists and belongs to ``user_id``, else 404."""
    unique_ids = list(dict.fromkeys(item_ids))
    found = set(
        db.scalars(select(Item.id).where(Item.id.in_(unique_ids), Item.owner_id == user_id)).all()
    )
    if len(found) != len(unique_ids):
        raise HTTPException(status_code=404, detail="item not found")


@router.get("", response_model=list[OutfitOut])
def list_outfits(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Outfit]:
    return list(db.scalars(select(Outfit).where(Outfit.owner_id == user.id)).all())


@router.post("", response_model=OutfitOut, status_code=201)
def create_outfit(
    payload: OutfitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Outfit:
    _resolve_item_ids(db, user.id, payload.item_ids)
    outfit = Outfit(name=payload.name, item_ids=payload.item_ids, owner_id=user.id)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return outfit


@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Outfit:
    outfit = db.scalar(select(Outfit).where(Outfit.id == outfit_id, Outfit.owner_id == user.id))
    if outfit is None:
        raise HTTPException(status_code=404, detail="outfit not found")
    return outfit


@router.patch("/{outfit_id}", response_model=OutfitOut)
def update_outfit(
    outfit_id: int,
    payload: OutfitUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Outfit:
    outfit = db.scalar(select(Outfit).where(Outfit.id == outfit_id, Outfit.owner_id == user.id))
    if outfit is None:
        raise HTTPException(status_code=404, detail="outfit not found")
    if payload.name is not None:
        outfit.name = payload.name
    if payload.item_ids is not None:
        _resolve_item_ids(db, user.id, payload.item_ids)
        outfit.item_ids = payload.item_ids
    db.commit()
    db.refresh(outfit)
    return outfit


@router.delete("/{outfit_id}", status_code=204)
def delete_outfit(
    outfit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    outfit = db.scalar(select(Outfit).where(Outfit.id == outfit_id, Outfit.owner_id == user.id))
    if outfit is None:
        raise HTTPException(status_code=404, detail="outfit not found")
    db.delete(outfit)
    db.commit()
