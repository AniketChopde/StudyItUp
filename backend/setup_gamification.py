"""
Explicit setup script for new gamification tables.
"""
import asyncio
from sqlalchemy import text
from loguru import logger
from database.connection import engine
from models.gamification import UserXP, Badge, UserBadge

async def setup_gamification_tables():
    logger.info("Setting up Gamification tables...")
    async with engine.begin() as conn:
        # We can just call run_sync with standard Base.metadata.create_all
        # since the gamification models are now imported in models/__init__.py
        from database.connection import Base
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Gamification tables created successfully.")

if __name__ == "__main__":
    asyncio.run(setup_gamification_tables())
