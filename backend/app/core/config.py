"""
Application configuration.

All values can be overridden via environment variables or a `.env` file
placed next to this backend (see `.env.example`).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "KinnowERP API"
    ENV: str = "development"

    # --- Database ---
    # Example: postgresql+pg8000://user:password@localhost:5432/kinonow_erp
    DATABASE_URL: str = "postgresql+pg8000://postgres:postgres@localhost:5432/kinonow_erp"

    # --- Auth / JWT ---
    SECRET_KEY: str = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # --- CORS ---
    # Comma separated list of allowed origins, e.g.
    # "http://localhost:5173,https://your-app-domain.com,file://"
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
