import os
from dotenv import load_dotenv
from loguru import logger
import sys

# Add backend to path
sys.path.append(os.getcwd())

# Load .env
load_dotenv()

from services.sarvam_service import SarvamService

service = SarvamService()
print(f"Service initialized: {service.client is not None}")
print(f"API Key found: {bool(service.api_key)}")
if service.api_key:
    print(f"API Key starts with: {service.api_key[:6]}...")
