from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application configuration settings.
    Validates environment variables on startup using Pydantic.
    """

    # App Metadata
    PROJECT_NAME: str = "SuaraNiaga API"
    API_VERSION: str = "v1"
    API_ENV: str = "development"

    # CORS Configuration
    # Used to allow requests from the specific frontend origin
    FRONTEND_URL: str

    # AI Service Credentials (Groq LPU)
    # Required for both Speech-to-Text (Whisper) and Inference (Llama 3)
    GROQ_API_KEY: str

    # Database Credentials (Supabase)
    # Use the 'anon' (public) key for standard operations with RLS enabled
    SUPABASE_URL: str
    SUPABASE_KEY: str

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance to be imported throughout the app
settings = Settings()
