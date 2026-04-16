from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "IMEITrack API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/imeitrack"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    assistant_provider: str = "grounded"
    assistant_api_key: str | None = None

    cors_origins: list[str] | str = ["http://localhost:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
