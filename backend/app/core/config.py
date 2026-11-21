import os
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PatchPilot — Intelligent Security Remediation Assistant"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./patchpilot.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # AI Service Configuration
    AI_PROVIDER: Optional[str] = None  # e.g., 'openai', 'gemini', 'anthropic', or None
    AI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = None
    AI_API_URL: Optional[str] = None

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if not v or v.strip() == "":
            return "sqlite:///./patchpilot.db"
        # Support postgres:// -> postgresql:// for SQLAlchemy 2.x
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg2://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v


settings = Settings()
