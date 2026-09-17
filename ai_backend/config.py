import os
from typing import List, Union
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Try loading from ai_backend/.env, then backend/.env, then root .env
current_dir = os.path.dirname(os.path.abspath(__file__))
env_candidates = [
    os.path.join(current_dir, ".env"),
    os.path.join(os.path.dirname(current_dir), "backend", ".env"),
    os.path.join(os.path.dirname(current_dir), ".env"),
]

for env_path in env_candidates:
    if os.path.exists(env_path):
        load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nothing But Adventures AI Assistant"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000"

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        case_sensitive = True
        env_file = os.path.join(current_dir, ".env")
        extra = "ignore"

settings = Settings()
