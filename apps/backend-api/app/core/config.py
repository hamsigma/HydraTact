from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Konfigurasi lingkungan peladen FastAPI HydraTact Samarinda."""

    PROJECT_NAME: str = "HydraTact Samarinda Tactical Coordination API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Supabase & PostgreSQL PostGIS Configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:54322/postgres"
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_ANON_KEY: str = "local-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "local-service-role-key"

    # Database Connection Pool Settings (asyncpg)
    DB_POOL_MIN_SIZE: int = 2
    DB_POOL_MAX_SIZE: int = 10
    DB_POOL_TIMEOUT_SECONDS: float = 10.0

    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
