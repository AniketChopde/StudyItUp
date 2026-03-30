"""
Service for generating and managing educational illustrations.
"""

from loguru import logger
from typing import Optional
from services.azure_openai import azure_openai_service
import hashlib

class ImageService:
    """Service for educational illustrations."""
    
    def __init__(self):
        self.image_cache = {}

    async def generate_illustration(self, prompt: str, topic: str = "") -> str:
        """
        Generate or fetch a high-quality 2D educational illustration.
        
        Args:
            prompt: Detailed description of the visual needed.
            topic: The parent topic for context.
            
        Returns:
            URL of the image.
        """
        try:
            # Create a cache key based on the prompt
            cache_key = hashlib.md5(prompt.encode()).hexdigest()
            if cache_key in self.image_cache:
                logger.info(f"Returning cached image for prompt: {prompt[:30]}...")
                return self.image_cache[cache_key]

            # Enhance prompt for a consistent "Whiteboard / 2D Vector" aesthetic
            # We want illustrations that look good in both sketchy and technical themes.
            enhanced_prompt = (
                f"A high-quality 2D educational illustration of {prompt}. "
                f"Style: Clean vector art, flat design, educational diagram, "
                f"white background, professional, cinematic lighting, "
                f"related to {topic if topic else 'education'}. "
                f"No text, no labels, just the visual concept."
            )

            image_url = await azure_openai_service.generate_image(enhanced_prompt)
            
            # If the service falls back to Unsplash, use a MORE reliable URL structure
            if "source.unsplash.com" in image_url:
                # Map common educational keywords to specific, high-quality Unsplash IDs for reliability
                topic_map = {
                    "solar system": "1464870181534-7d99c646c60b", # Space, Planets
                    "sun": "1529690653852-9d1ef39b9bc2", # Sun
                    "atom": "1635070041078-e363dbe005cb", # Molecule/Science
                    "dna": "1530210124550-912cf1381cb8", # DNA
                    "earth": "1614730321146-26b48e3d48d8", # Earth
                    "moon": "1522030239040-1ae28cda41c0", # Moon
                }
                
                # Check for keywords in the prompt to match a specific ID
                match_id = "1534774592507-2706003295a9" # Default Education/Science ID
                for key, val in topic_map.items():
                    if key in prompt.lower() or key in topic.lower():
                        match_id = val
                        break
                
                image_url = f"https://images.unsplash.com/photo-{match_id}?w=1000&q=80"

            # Cache the result
            self.image_cache[cache_key] = image_url
            return image_url

        except Exception as e:
            logger.error(f"Error in image_service.generate_illustration: {str(e)}")
            # Fallback to Unsplash
            query = f"education,{topic.replace(' ', ',') if topic else 'learning'}"
            return f"https://images.unsplash.com/photo-1546410531-bb4caa1b424d?auto=format&fit=crop&q=80&w=1000"

# Global image service instance
image_service = ImageService()
