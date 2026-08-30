"""Pydantic schemas for clothing items.

``category`` is constrained to the closed set agreed for the sprint:
``oberteil``, ``hose``, ``kleid``, ``schuhe``, ``accessoire``.
"""

from pydantic import BaseModel, ConfigDict

CATEGORIES: frozenset[str] = frozenset({"oberteil", "hose", "kleid", "schuhe", "accessoire"})


class ItemCreate(BaseModel):
    name: str
    category: str
    description: str | None = None
    color: str | None = None


class ItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    description: str | None = None
    color: str | None = None


class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    description: str | None
    color: str | None
    image_url: str
    owner_id: int
