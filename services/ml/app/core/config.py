from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "TactIQ ML Intelligence Engine"
    API_V1_STR: str = "/api/ml"
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CHANNEL: str = "tactiq_tracking_stream"
    ALLOWED_ORIGINS: List[str] = ["*"]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
