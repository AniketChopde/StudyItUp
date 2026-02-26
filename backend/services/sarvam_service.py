"""
Sarvam AI Service for high-quality Text-to-Speech.
"""

import os
from sarvamai import SarvamAI
from loguru import logger
import base64
from typing import Optional, Dict, Any

from config import settings

class SarvamService:
    """Service to interact with Sarvam AI for TTS."""
    
    def __init__(self):
        from dotenv import load_dotenv
        import os
        load_dotenv()
        
        # Try both settings and os.environ
        self.api_key = settings.sarvam_api_key or os.getenv("SARVAM_API_KEY", "")
        # Strip potential quotes
        self.api_key = self.api_key.strip("'\"")
        
        self.client = None
        if self.api_key and self.api_key not in ["SARVAM_SUBSCRIPTION_API_KEY", "YOUR_API_KEY", ""]:
            try:
                from sarvamai import SarvamAI
                self.client = SarvamAI(api_subscription_key=self.api_key)
                logger.info(f"Sarvam AI client initialized successfully with key: {self.api_key[:6]}...")
            except Exception as e:
                logger.error(f"Failed to initialize Sarvam AI client: {e}")
        else:
            logger.warning(f"Sarvam AI NOT initialized. Key present: {bool(self.api_key)}, Key value: '{self.api_key}'")

    async def text_to_speech(self, text: str, language_code: str = "en-IN") -> Optional[str]:
        """
        Convert text to speech using Sarvam AI.
        Returns base64 encoded audio string or None if failed.
        """
        if not self.client:
            logger.warning("Sarvam AI client not initialized. Falling back.")
            return None
            
        try:
            # Use high-quality parameters as per user snippet
            response = self.client.text_to_speech.convert(
                text=text,
                target_language_code=language_code,
                speaker="shubh",
                model="bulbul:v3",
                pace=1.1,
                speech_sample_rate=22050,
                enable_preprocessing=True
            )
            
            # The SDK might return an object (Pydantic model) or a dictionary
            audios = None
            if hasattr(response, "audios"):
                audios = response.audios
            elif isinstance(response, dict):
                audios = response.get("audios")
            
            if audios and len(audios) > 0:
                logger.debug(f"Successfully extracted Sarvam AI audio (length: {len(audios[0])})")
                return audios[0]
            
            logger.error(f"Sarvam AI returned unexpected response structure: {response}")
            return None
            
        except Exception as e:
            logger.error(f"Error during Sarvam TTS conversion: {e}")
            return None

# Global instance
sarvam_service = SarvamService()
