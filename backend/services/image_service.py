"""
Service for generating and managing educational illustrations.
Uses multiple sources: Wikimedia → Unsplash → Generated SVG fallback.
"""

from loguru import logger
import hashlib
import urllib.request
import urllib.parse
import json

class ImageService:
    """Service for educational illustrations from multiple sources."""
    
    def __init__(self):
        self.image_cache = {}

    async def generate_illustration(self, prompt: str, topic: str = "", is_character: bool = False) -> str:
        """
        Fetch a high-quality educational illustration or animated character.
        Priority for Characters: Cache → Giphy Sticker → raise for Icon fallback
        Priority for Diagrams: Cache → Wikimedia SVG/GIF → Unsplash photo → raise
        """
        try:
            cache_key = hashlib.md5(f"{prompt}_{topic}".encode()).hexdigest()
            if cache_key in self.image_cache:
                return self.image_cache[cache_key]

            # Extract core search terms (first 3 meaningful words)
            search_terms = ' '.join(prompt.replace('flat 2D illustration of', '')
                                         .replace('educational style', '')
                                         .replace('white background', '')
                                         .replace('colorful', '')
                                         .replace('simple', '')
                                         .replace('diagram showing', '')
                                         .strip().split()[:4])
            if not search_terms:
                search_terms = topic

            # If it's a character, prioritize Giphy transparent stickers
            if is_character:
                try:
                    giphy_url = self._giphy_search(search_terms)
                    if giphy_url:
                        self.image_cache[cache_key] = giphy_url
                        return giphy_url
                except Exception as e:
                    logger.warning(f"Giphy search failed: {e}")
                
                # If Giphy fails for a character, we immediately raise so the frontend falls back
                # to our 100% reliable animated Icon Puppets.
                raise Exception(f"No transparent character found for: {search_terms}")

            # PASS 1: Wikimedia SVG/PNG search (for non-characters)
            try:
                wiki_url = self._wikimedia_search(search_terms)
                if wiki_url:
                    self.image_cache[cache_key] = wiki_url
                    return wiki_url
            except Exception:
                pass

            # PASS 2: Unsplash (free, high quality photos)
            try:
                unsplash_url = self._unsplash_search(search_terms)
                if unsplash_url:
                    self.image_cache[cache_key] = unsplash_url
                    return unsplash_url
            except Exception:
                pass

            # No image found — raise so orchestrator converts to icon card
            raise Exception(f"No image found for: {search_terms}")

        except Exception as e:
            logger.error(f"Image service error: {str(e)}")
            raise e

    def _wikimedia_search(self, query: str) -> str | None:
        """Search Wikimedia Commons for SVG/PNG illustrations."""
        search = urllib.parse.quote(f"{query} filetype:svg|png")
        url = (f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
               f"&gsrsearch={search}&gsrnamespace=6&prop=imageinfo&iiprop=url"
               f"&format=json&gsrlimit=3&uselang=en")
        
        req = urllib.request.Request(url, headers={'User-Agent': 'NexusLearn-Bot/1.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
        
        pages = data.get("query", {}).get("pages", {})
        if pages:
            for page in pages.values():
                img_url = page.get("imageinfo", [{}])[0].get("url", "")
                if img_url and any(img_url.lower().endswith(ext) for ext in ['.svg', '.png', '.gif']):
                    logger.info(f"Wikimedia image found: {img_url[:80]}")
                    return img_url
        return None

    def _unsplash_search(self, query: str) -> str | None:
        """Get a free Unsplash photo (no API key needed for source URLs)."""
        clean_q = urllib.parse.quote(query.strip())
        url = f"https://source.unsplash.com/600x400/?{clean_q}"
        logger.info(f"Unsplash fallback: {url}")
        return url

    def _giphy_search(self, query: str) -> str | None:
        """Search Giphy Stickers (transparent animated GIFs) for characters."""
        clean_q = urllib.parse.quote(query.strip())
        # Using the standard public beta key for Giphy
        url = f"https://api.giphy.com/v1/stickers/search?api_key=dc6zaTOxFJmzC&q={clean_q}&limit=1&rating=pg"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'NexusLearn-Bot/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            
        gifs = data.get("data", [])
        if gifs and len(gifs) > 0:
            # We want the 'original' or 'fixed_height' URL
            img_url = gifs[0].get("images", {}).get("fixed_height", {}).get("url", "")
            if img_url:
                logger.info(f"Giphy character found: {img_url[:80]}")
                return img_url
        return None

# Global image service instance
image_service = ImageService()
