import asyncio
import sqlite3
import sqlalchemy
from sqlalchemy import create_async_engine, text
from database.connection import Base, engine
from models.gamification import UserXP, UserStreak, Guild, PowerUp, UserInventory, DailyQuest, Badge, UserBadge
from loguru import logger
import os

DB_PATH = "./study_planner.db"

def run_migration():
    logger.info("Starting SQLite schema migration...")
    
    if not os.path.exists(DB_PATH):
        logger.error(f"Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Define migrations
    migrations = [
        # Table user_xp
        ("user_xp", "coins", "INTEGER DEFAULT 0"),
        ("user_xp", "guild_id", "CHAR(36)"),
        
        # Table user_streaks
        ("user_streaks", "streak_multiplier", "FLOAT DEFAULT 1.0"),
        ("user_streaks", "streak_shields", "INTEGER DEFAULT 0"),
    ]

    for table, column, col_type in migrations:
        try:
            # Check if column exists
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [info[1] for info in cursor.fetchall()]
            
            if column not in columns:
                logger.info(f"Adding column '{column}' to table '{table}'...")
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                logger.success(f"Column '{column}' added successfully.")
            else:
                logger.debug(f"Column '{column}' already exists in table '{table}'.")
        except Exception as e:
            logger.error(f"Error migrating {table}.{column}: {str(e)}")

    conn.commit()
    conn.close()
    logger.success("Schema migration completed.")

async def sync_tables():
    logger.info("Syncing new tables with SQLAlchemy...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.success("Table sync completed.")

if __name__ == "__main__":
    # Run SQLite native migration first
    run_migration()
    # Run SQLAlchemy table creation for totally new tables
    asyncio.run(sync_tables())
