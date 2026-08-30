"""Application configuration loaded from the environment.

Every value has a safe default (or an empty one, for secrets) so that a fresh
clone boots immediately. Secrets such as ``JWT_SECRET`` carry no literal in the
repository: they are rolled per run by the runner declared in ``RUN.json``.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


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


settings = Settings()
