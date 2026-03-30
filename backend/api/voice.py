"""
API endpoints for AI Voice and TTS.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from services.sarvam_service import sarvam_service
from utils.auth import get_current_user, TokenData
from langfuse import observe

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language_code: Optional[str] = "en-IN"

class TTSResponse(BaseModel):
    audio_base64: str
    status: str = "success"

@router.post("/tts", response_model=TTSResponse)
@observe()
async def text_to_speech(
    request: TTSRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Convert text to speech using Sarvam AI.
    Returns base64 encoded audio.
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        audio_b64 = await sarvam_service.text_to_speech(
            text=request.text,
            language_code=request.language_code
        )

        if not audio_b64:
             # Try fallback or re-try? 
             # Actually, if Sarvam fails, we should handle it gracefully
             logger.error(f"Sarvam AI failed to generate audio for text: {request.text[:50]}...")
             raise HTTPException(
                 status_code=502,
                 detail="Voice synthesis service failed. Please try again later."
             )

        return TTSResponse(audio_base64=audio_b64)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in TTS endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
