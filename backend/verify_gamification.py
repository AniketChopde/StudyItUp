
import asyncio
from sqlalchemy import select
from database.connection import AsyncSessionLocal
from models.gamification import UserXP, UserStreak, DailyQuest
from api.gamification import process_xp_award
import uuid

async def verify_gamification():
    async with AsyncSessionLocal() as session:
        # Get a test user (first user in DB)
        from models.user import User
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("No user found to test.")
            return

        user_id = user.id
        print(f"Testing for user: {user.email} ({user_id})")

        # 1. Test XP Award & Quest Progress
        # Award XP for quiz_complete
        print("Awarding XP for quiz_complete...")
        await process_xp_award(session, user_id, "quiz_complete", score=100)
        
        # Verify quest progress
        q_result = await session.execute(
            select(DailyQuest).where(DailyQuest.user_id == user_id, DailyQuest.requirement_type == "quiz")
        )
        quest = q_result.scalar_one_or_none()
        if quest:
            print(f"Quest '{quest.title}' progress: {quest.current_count}/{quest.target_count} (Completed: {quest.is_completed})")
        else:
            print("No quiz quest found (might need to call profile endpoint first to generate them).")

        # 2. Verify Streak
        s_result = await session.execute(select(UserStreak).where(UserStreak.user_id == user_id))
        streak = s_result.scalar_one_or_none()
        if streak:
            print(f"User streak: {streak.current_streak} (Last activity: {streak.last_activity_date})")

        await session.commit()

if __name__ == "__main__":
    asyncio.run(verify_gamification())
