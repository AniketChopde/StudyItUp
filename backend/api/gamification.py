"""
Gamification API – profiles, XP awarding, and badges.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from datetime import datetime
import uuid

from database.connection import get_db
from models.gamification import UserXP, Badge, UserBadge, GamificationProfile, BadgeOut, XPAwardRequest
from utils.auth import get_current_user, TokenData

router = APIRouter()

# Leveling curve: Level N requires N*100 XP
def calculate_level(total_xp: int) -> int:
    level = 1
    xp_for_next = 100
    while total_xp >= xp_for_next:
        total_xp -= xp_for_next
        level += 1
        xp_for_next = level * 100
    return level

def xp_to_next_level(total_xp: int, current_level: int) -> int:
    # Calculate total XP needed for the current level
    total_needed = sum(l * 100 for l in range(1, current_level + 1))
    return total_needed - total_xp

@router.get("/profile", response_model=GamificationProfile)
async def get_gamification_profile(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the user's XP, level, and badges."""
    user_id = current_user.user_id

    # Get or create UserXP
    result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    user_xp = result.scalar_one_or_none()
    
    if not user_xp:
        user_xp = UserXP(user_id=user_id, total_xp=0, level=1)
        db.add(user_xp)
        await db.commit()
        await db.refresh(user_xp)

    # Get earned badges
    badges_result = await db.execute(
        select(Badge, UserBadge.earned_at)
        .join(UserBadge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
    )
    
    badges_out = []
    for badge, earned_at in badges_result.all():
        badges_out.append(BadgeOut(
            badge_key=badge.badge_key,
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            earned_at=earned_at
        ))

    return GamificationProfile(
        total_xp=user_xp.total_xp,
        level=user_xp.level,
        xp_to_next_level=xp_to_next_level(user_xp.total_xp, user_xp.level),
        badges=badges_out
    )

@router.post("/award-xp")
async def award_xp_endpoint(
    request: XPAwardRequest,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Award XP for an event (quiz completion, chapter completion, etc).
    Also checks for and awards badges.
    """
    return await process_xp_award(db, current_user.user_id, request.event, request.score)

async def process_xp_award(db: AsyncSession, user_id: uuid.UUID, event: str, score: float = None):
    """Internal function to process XP and badges."""
    xp_awarded = 0
    if event == "quiz_complete":
        xp_awarded = 10
        if score is not None and score >= 80:
            xp_awarded += 15  # High score bonus
    elif event == "chapter_complete":
        xp_awarded = 25
    elif event == "streak_daily":
        xp_awarded = 15
    elif event == "chat_interaction":
        xp_awarded = 2
        
    if xp_awarded == 0:
        return {"message": "No XP awarded for this event."}
        
    # Get or create UserXP
    result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    user_xp = result.scalar_one_or_none()
    
    if not user_xp:
        user_xp = UserXP(user_id=user_id, total_xp=0, level=1)
        db.add(user_xp)
    
    user_xp.total_xp += xp_awarded
    
    # Check level up
    new_level = calculate_level(user_xp.total_xp)
    leveled_up = new_level > user_xp.level
    user_xp.level = new_level
    
    await db.commit()
    
    # Badge checking logic
    badges_awarded = []
    
    if leveled_up and new_level == 5:
        badge_key = "level_5"
        await _award_badge_if_earned(db, user_id, badge_key, "Dedicated Scholar", "Reached Level 5", "🎖️", badges_awarded)
        
    if event == "quiz_complete" and score is not None and score == 100:
        badge_key = "perfect_score"
        await _award_badge_if_earned(db, user_id, badge_key, "Flawless Victory", "Scored 100% on a quiz", "🎯", badges_awarded)
        
    return {
        "awarded_xp": xp_awarded,
        "new_total_xp": user_xp.total_xp,
        "level": user_xp.level,
        "leveled_up": leveled_up,
        "badges_awarded": badges_awarded
    }

async def _award_badge_if_earned(db: AsyncSession, user_id: uuid.UUID, badge_key: str, name: str, desc: str, icon: str, awarded_list: list):
    # Ensure badge exists
    b_result = await db.execute(select(Badge).where(Badge.badge_key == badge_key))
    badge = b_result.scalar_one_or_none()
    if not badge:
        badge = Badge(badge_key=badge_key, name=name, description=desc, icon=icon)
        db.add(badge)
        await db.commit()
        await db.refresh(badge)
        
    # Check if user already has it
    ub_result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id)
    )
    if not ub_result.scalar_one_or_none():
        new_ub = UserBadge(user_id=user_id, badge_id=badge.id)
        db.add(new_ub)
        await db.commit()
        awarded_list.append({
            "badge_key": badge.badge_key,
            "name": badge.name,
            "icon": badge.icon
        })
