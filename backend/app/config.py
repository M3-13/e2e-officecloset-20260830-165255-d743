"""Application configuration loaded from the environment.

Every value has a safe default (or an empty one, for secrets) so that a fresh
clone boots immediately. Secrets such as ``JWT_SECRET`` carry no literal in the
repository: when none is supplied via the environment, the secret is read from
a local file (``backend/.jwt_secret``) or generated once and persisted there, so
it stays identical across process restarts.
"""

import secrets
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# ``backend/.jwt_secret`` — kept out of version control via ``.gitignore``.
JWT_SECRET_FILE = Path(__file__).resolve().parent.parent / ".jwt_secret"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    jwt_secret: str = ""
    database_url: str = "sqlite:///./wardrobe.db"
    upload_dir: str = "./uploads"
    frontend_origin: str = "http://localhost:5173"
    max_upload_size: int = 5_242_880


def _load_or_create_jwt_secret() -> str:
    """Return a stable JWT secret, persisted so it survives restarts.

    Prefers an explicitly supplied ``JWT_SECRET`` (environment or ``.env``).
    Otherwise reads ``backend/.jwt_secret``; if it does not exist, generates a
    32-byte hex secret and writes it there so a token issued before a restart
    stays valid afterwards.
    """
    if settings.jwt_secret:
        return settings.jwt_secret

    if JWT_SECRET_FILE.exists():
        stored = JWT_SECRET_FILE.read_text(encoding="utf-8").strip()
        if stored:
            return stored

    generated = secrets.token_hex(32)
    JWT_SECRET_FILE.parent.mkdir(parents=True, exist_ok=True)
    JWT_SECRET_FILE.write_text(generated, encoding="utf-8")
    return generated


settings = Settings()
settings.jwt_secret = _load_or_create_jwt_secret()
