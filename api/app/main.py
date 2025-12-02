from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import transcribe, transactions
from app.core.config import settings

# Initialize FastAPI application with metadata from settings
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Backend service for voice processing and transaction management."
)

# CORS Configuration
# Enables cross-origin requests from the frontend application
origins = [
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all standard HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Register API Routers
# /transcribe: Handles voice uploads and AI processing
# /transactions: Handles data retrieval for UI history
app.include_router(transcribe.router,
                   prefix=f"/api/{settings.API_VERSION}", tags=["Voice Processing"])
app.include_router(transactions.router,
                   prefix=f"/api/{settings.API_VERSION}", tags=["Transaction History"])


@app.get("/health")
def health_check():
    """
    Health check endpoint for container/orchestrator probes.
    """
    return {
        "status": "healthy",
        "environment": settings.API_ENV,
        "service": settings.PROJECT_NAME
    }
