"""
Langfuse service for LLM observability and tracing.
"""

from langfuse import Langfuse, observe
from loguru import logger
import os

from config import settings

class LangfuseService:
    """Service for managing Langfuse client and tracing."""
    
    def __init__(self):
        """Initialize Langfuse client."""
        self.public_key = settings.langfuse_public_key
        self.secret_key = settings.langfuse_secret_key
        self.host = settings.langfuse_base_url
        
        # Set environment variables for Langfuse SDK (used by @observe decorator)
        if self.public_key and self.secret_key:
            os.environ["LANGFUSE_PUBLIC_KEY"] = self.public_key
            os.environ["LANGFUSE_SECRET_KEY"] = self.secret_key
            os.environ["LANGFUSE_BASE_URL"] = self.host
            
            try:
                self.client = Langfuse(
                    public_key=self.public_key,
                    secret_key=self.secret_key,
                    host=self.host
                )
                logger.info("✅ Langfuse storage/tracing initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Langfuse: {str(e)}")
                self.client = None
        else:
            logger.warning("⚠️ Langfuse keys missing. Observability will be disabled.")
            self.client = None

    def get_client(self) -> Langfuse:
        """Get the Langfuse client instance."""
        return self.client

# Global service instance
langfuse_service = LangfuseService()
