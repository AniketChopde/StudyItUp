"""
Service for generating and managing educational illustrations.
Uses multiple sources: Wikimedia → Unsplash → Generated SVG fallback.
"""

from loguru import logger
import hashlib
import urllib.request
import urllib.parse
import json
import os

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

            # If it's a character, prioritize IconScout Premium Lotties, then fallback to Giphy
            if is_character:
                try:
                    if os.environ.get('ICONSCOUT_CLIENT_ID'):
                        logger.info(f"Querying IconScout Premium 2D Vectors for: {search_terms}")
                        icon_url = self._iconscout_search(search_terms)
                        if icon_url:
                            self.image_cache[cache_key] = icon_url
                            return icon_url
                except Exception as e:
                    logger.warning(f"IconScout search failed or 0 results: {e}")
                
                try:
                    if os.environ.get('LORDICON_API_KEY'):
                        logger.info(f"Querying Lordicon SVGs for: {search_terms}")
                        lordicon_url = self._lordicon_search(search_terms)
                        if lordicon_url:
                            self.image_cache[cache_key] = lordicon_url
                            return lordicon_url
                except Exception as e:
                    logger.warning(f"Lordicon search failed or 0 results: {e}")

                try:
                    logger.info(f"Querying Giphy API for: {search_terms}")
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
        
        # Pull API key from env or fallback to stable beta key
        api_key = os.environ.get('GIPHY_API_KEY', 'dc6zaTOxFJmzC')
        url = f"https://api.giphy.com/v1/stickers/search?api_key={api_key}&q={clean_q}&limit=1&rating=pg"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'NexusLearn-Bot/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read())
                if data.get('data') and len(data['data']) > 0:
                    return data['data'][0]['images']['fixed_height']['url']
        except Exception as e:
            logger.error(f"Giphy API error: {e}")
        return None

    def _iconscout_search(self, query: str) -> str | None:
        """Search IconScout API for premium 2D Lottie animations (flat vector style)."""
        clean_q = urllib.parse.quote(query.strip())
        client_id = os.environ.get('ICONSCOUT_CLIENT_ID')
        secret = os.environ.get('ICONSCOUT_SECRET')
        
        if not client_id or not secret:
            return None
            
        url = f"https://api.iconscout.com/v3/search?query={clean_q}&asset=lottie&price=free"
        headers = {
            'Client-ID': client_id,
            'Secret': secret,
            'Accept': 'application/json',
            'User-Agent': 'NexusLearn/1.0'
        }
        
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read())
                # Returns 'elements' array inside 'data' or similar schema
                # Current API format: data['response']['items']['data']
                if 'response' in data and 'items' in data['response'] and 'data' in data['response']['items']:
                    items = data['response']['items']['data']
                    if len(items) > 0 and 'urls' in items[0] and 'thumb' in items[0]['urls']:
                        # IconScout often returns an animated .mp4 thumbnail for lotties
                        return items[0]['urls']['thumb']
        except Exception as e:
            logger.error(f"IconScout API error for {query}: {e}")
            
        return None

    def _lordicon_search(self, query: str) -> str | None:
        """Search Lordicon API for high-quality static flat SVGs."""
        clean_q = urllib.parse.quote(query.strip())
        api_key = os.environ.get('LORDICON_API_KEY')
        
        if not api_key:
            return None
            
        url = f"https://api.lordicon.com/v1/icons?query={clean_q}&limit=2"
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Accept': 'application/json',
            'User-Agent': 'NexusLearn/1.0'
        }
        
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read())
                # Lordicon returns a list of dictionaries if successful
                if isinstance(data, list) and len(data) > 0:
                    first_icon = data[0]
                    if 'files' in first_icon and 'preview' in first_icon['files']:
                        return first_icon['files']['preview']
        except Exception as e:
            logger.error(f"Lordicon API error for {query}: {e}")
            
        return None

# Global image service instance
image_service = ImageService()
