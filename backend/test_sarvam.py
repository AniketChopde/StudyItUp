import asyncio
from services.sarvam_service import sarvam_service

async def test_tts():
    print("Testing Sarvam AI TTS...")
    text = "Welcome to NexusLearn. Let's learn about the structure of an atom."
    audio = await sarvam_service.text_to_speech(text)
    if audio:
        print(f"Success! Audio length: {len(audio)}")
    else:
        print("Failed to generate audio.")

if __name__ == "__main__":
    asyncio.run(test_tts())
