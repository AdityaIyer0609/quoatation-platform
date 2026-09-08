from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "QuoteCraft API"
    secret_key: str = "change-me-in-development"
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/quotation"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
