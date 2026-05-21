import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def get_latest_plan():
    engine = create_async_engine('sqlite+aiosqlite:///./study_planner.db')
    async with engine.connect() as conn:
        result = await conn.execute(text('SELECT id, exam_type, recommended_courses FROM study_plans ORDER BY created_at DESC LIMIT 1'))
        row = result.fetchone()
        if row:
            print(f'Plan ID: {row[0]}, Exam: {row[1]}')
            courses = json.loads(row[2]) if row[2] else None
            if courses:
                for c in courses:
                    print(f"- Title: {c.get('title')}")
                    print(f"  URL: {c.get('url')}")
                    print(f"  Platform: {c.get('platform')}")
            else:
                print('No recommended courses yet.')

asyncio.run(get_latest_plan())
