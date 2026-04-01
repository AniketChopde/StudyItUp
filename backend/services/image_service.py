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

    async def generate_illustration(self, prompt: str, topic: str = "") -> str:
        """
        Fetch a high-quality educational illustration.
        Priority: Cache → Wikimedia SVG/GIF → Unsplash photo → raise for fallback
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

            # PASS 1: Wikimedia SVG/PNG search
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
        # Use Unsplash Source redirect — returns a random photo for the query
        clean_q = urllib.parse.quote(query.strip())
        url = f"https://source.unsplash.com/600x400/?{clean_q}"
        logger.info(f"Unsplash fallback: {url}")
        return url

# Global image service instance
image_service = ImageService()
