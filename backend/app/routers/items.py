"""Clothing-item routes.

Every query is scoped to the authenticated user's ``owner_id``; a request for
an item that does not exist or belongs to another user answers ``404``.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import storage
from app.database import get_db
from app.deps import get_current_user
from app.models import Item, User
from app.schemas.items import CATEGORIES, ItemOut

router = APIRouter()


def _get_owned_item(item_id: int, user: User, db: Session) -> Item:
    item = db.get(Item, item_id)
    if item is None or item.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden")
    return item


def _validate_category(category: str) -> None:
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Ungültige Kategorie")


def _read_valid_image(image: UploadFile) -> tuple[bytes, str]:
    data = image.file.read()
    try:
        content_type = storage.validate_image(data)
    except storage.InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return data, content_type


@router.get("", response_model=list[ItemOut])
def list_items(
    category: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Item]:
    stmt = select(Item).where(Item.owner_id == user.id)
    if category is not None:
        stmt = stmt.where(Item.category == category)
    return list(db.scalars(stmt).all())


@router.post("", response_model=ItemOut, status_code=201)
def create_item(
    name: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    description: str | None = Form(None),
    color: str | None = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Item:
    _validate_category(category)
    data, content_type = _read_valid_image(image)

    item = Item(
        name=name,
        category=category,
        description=description,
        color=color,
        owner_id=user.id,
        image_url="",
    )
    db.add(item)
    db.flush()

    item.image_url = storage.save_image(item.id, data, content_type)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{item_id}", response_model=ItemOut)
def get_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Item:
    return _get_owned_item(item_id, user, db)


@router.patch("/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    name: str | None = Form(None),
    category: str | None = Form(None),
    description: str | None = Form(None),
    color: str | None = Form(None),
    image: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Item:
    item = _get_owned_item(item_id, user, db)

    if name is not None:
        item.name = name
    if category is not None:
        _validate_category(category)
        item.category = category
    if description is not None:
        item.description = description
    if color is not None:
        item.color = color
    if image is not None:
        data, content_type = _read_valid_image(image)
        item.image_url = storage.replace_image(item.id, data, content_type)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    item = _get_owned_item(item_id, user, db)
    storage.delete_image(item.id)
    db.delete(item)
    db.commit()
    return Response(status_code=204)


@router.get("/{item_id}/image")
def get_item_image(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    _get_owned_item(item_id, user, db)
    loaded = storage.load_image(item_id)
    if loaded is None:
        raise HTTPException(status_code=404, detail="Bild nicht gefunden")
    data, content_type = loaded
    return Response(content=data, media_type=content_type)
