import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from database.connection import AsyncSessionLocal
from sqlalchemy import update
from models.study_plan import StudyPlan

async def clear_courses():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            update(StudyPlan).values(recommended_courses=[])
        )
        await db.commit()
        print(f"Cleared recommended_courses on {result.rowcount} study plans.")
        print("They will be regenerated with pinpoint LLM-curated links on next load.")

if __name__ == "__main__":
    asyncio.run(clear_courses())
