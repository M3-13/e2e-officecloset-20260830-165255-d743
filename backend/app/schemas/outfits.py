"""Pydantic schemas for the outfit routes."""

from pydantic import BaseModel, ConfigDict


class OutfitCreate(BaseModel):
    """Payload for ``POST /api/outfits``."""

    name: str
    item_ids: list[int]


class OutfitUpdate(BaseModel):
    """Payload for ``PATCH /api/outfits/{id}``; every field is optional."""

    name: str | None = None
    item_ids: list[int] | None = None


class OutfitOut(BaseModel):
    """Serialized outfit: ``Outfit`` from the shared interface."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    item_ids: list[int]
    owner_id: int
