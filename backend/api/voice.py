"""
Voice API endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from services.sarvam_service import sarvam_service
from utils.auth import get_current_user, TokenData

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language_code: str = "en-IN"

class TTSResponse(BaseModel):
    audio_base64: Optional[str] = None
    success: bool
    error: Optional[str] = None

@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(
    request: TTSRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Convert text to speech using Sarvam AI.
    """
    try:
        audio_b64 = await sarvam_service.text_to_speech(
            text=request.text,
            language_code=request.language_code
        )
        
        if audio_b64:
            return TTSResponse(audio_base64=audio_b64, success=True)
        else:
            return TTSResponse(success=False, error="Failed to generate audio via Sarvam AI")
            
    except Exception as e:
        logger.error(f"TTS API Error: {e}")
        return TTSResponse(success=False, error=str(e))
