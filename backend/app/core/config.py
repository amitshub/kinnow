from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "KinnowERP API"
    ENV: str = "development"

    # --- Database ---
    # Example: postgresql+pg8000://user:password@localhost:5432/kinonow_erp
    # Hosting platforms (e.g. Railway) usually inject a plain
    # "postgresql://..." or "postgres://..." URL — see the
    # `database_url_for_engine` property below, which rewrites that to use
    # the pg8000 driver automatically so no manual editing is needed there.
    DATABASE_URL: str = "postgresql+pg8000://postgres:postgres@localhost:5432/kinonow_erp"

    # --- Auth / JWT ---
    SECRET_KEY: str = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # --- CORS ---
    # Comma separated list of allowed origins, e.g.
    # "http://localhost:5173,https://your-app-domain.com,file://"
    CORS_ORIGINS: str = "*"

    # --- Twilio (WhatsApp) ---
    # Used only by the one-time seed script (app/db/init_db.py) to populate
    # company_settings.twilio_sid / twilio_token. Set these as real
    # environment variables (e.g. in Railway's Variables tab) — never commit
    # actual credentials into source code.
    TWILIO_SID: str | None = None
    TWILIO_TOKEN: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def database_url_for_engine(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = "postgresql+pg8000://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+pg8000://" + url[len("postgresql://"):]
        return url


settings = Settings()