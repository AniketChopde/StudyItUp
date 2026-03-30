import asyncio
from backend.services.azure_openai import azure_openai_service
from backend.config import settings

async def test_dalle():
    print(f"Testing DALL-E with deployment: {settings.azure_openai_dalle_deployment}")
    try:
        url = await azure_openai_service.generate_image("A 2D illustration of the sun")
        print(f"Success! Image URL: {url}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_dalle())
