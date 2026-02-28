"""
Gamification API – profiles, XP awarding, and badges.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import datetime as dt # for timedelta usage in blocks

from database.connection import get_db
from models.gamification import (
    UserXP, Badge, UserBadge, GamificationProfile, BadgeOut, 
    XPAwardRequest, UserStreak, DailyQuest, StreakOut, QuestOut, LeaderboardEntry,
    RPGStats, PowerUp, UserInventory, PowerUpOut, Guild, GuildOut
)
from models.user import User
from models.quiz import QuizSession
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
        user_xp = UserXP(user_id=user_id, total_xp=0, level=1, coins=50) # Starters gift
        db.add(user_xp)
        await db.commit()
        await db.refresh(user_xp)
    elif user_xp.coins is None:
        user_xp.coins = 0
        await db.commit()

    # --- Power Up Seeding (Ensure they exist) ---
    await _seed_power_ups(db)

    profile_badges = []
    # Auto-award level badges if missing (retroactive check)
    current_level = user_xp.level
    level_milestones = [
        (2, "level_2", "Level Explorer", "Reached Level 2", "🌱"),
        (3, "level_3", "Knowledge Seeker", "Reached Level 3", "📜"),
        (4, "level_4", "Consistent Learner", "Reached Level 4", "🔋"),
        (5, "level_5", "Dedicated Scholar", "Reached Level 5", "🎖️")
    ]
    
    awarded_any = False
    for lv, key, name, desc, icon in level_milestones:
        if current_level >= lv:
            # Check if badge already exists in UserBadge
            chk = await db.execute(
                select(UserBadge)
                .join(Badge, Badge.id == UserBadge.badge_id)
                .where(UserBadge.user_id == user_id, Badge.badge_key == key)
            )
            if not chk.scalar_one_or_none():
                # Award it
                await _award_badge_if_earned(db, user_id, key, name, desc, icon, [])
                awarded_any = True
    
    if awarded_any:
        await db.commit()

    # --- Streak Logic ---
    streak_result = await db.execute(select(UserStreak).where(UserStreak.user_id == user_id))
    user_streak = streak_result.scalar_one_or_none()
    
    if not user_streak:
        user_streak = UserStreak(user_id=user_id, current_streak=1, last_activity_date=datetime.utcnow())
        db.add(user_streak)
    else:
        # Check if we should increment or reset
        last_date = user_streak.last_activity_date.date()
        today = datetime.utcnow().date()
        diff = (today - last_date).days
        
        if diff == 1:
            user_streak.current_streak += 1
            user_streak.last_activity_date = datetime.utcnow()
            # Multiplier logic: Every 7 days increases multiplier by 0.1, max 2.0
            if user_streak.current_streak % 7 == 0:
                user_streak.streak_multiplier = min(2.0, user_streak.streak_multiplier + 0.1)
                # Award a streak shield at day 7, 14, 21 etc.
                user_streak.streak_shields += 1

            if user_streak.current_streak > user_streak.longest_streak:
                user_streak.longest_streak = user_streak.current_streak
        elif diff > 1:
            # Check for streak shield
            if user_streak.streak_shields > 0:
                user_streak.streak_shields -= 1
                user_streak.last_activity_date = datetime.utcnow()
                # Streak preserved!
            else:
                user_streak.current_streak = 1
                user_streak.streak_multiplier = 1.0 # Reset multiplier
                user_streak.last_activity_date = datetime.utcnow()
        # if diff == 0, already active today, do nothing
            
    # --- Daily Quests Logic ---
    # Fetch active quests (not expired)
    now = datetime.utcnow()
    quests_result = await db.execute(
        select(DailyQuest).where(DailyQuest.user_id == user_id, DailyQuest.expires_at > now)
    )
    active_quests = quests_result.scalars().all()
    
    if not active_quests:
        # Generate 3 new quests for the day
        quest_templates = [
            ("Arena Challenger", "quiz", 1, 50),
            ("Dungeon Delver", "chapter", 1, 100),
            ("Wisdom Trials", "chat", 3, 30)
        ]
        
        expiry = (now + dt.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        
        for title, rtype, target, xp in quest_templates:
            q = DailyQuest(
                user_id=user_id,
                title=title,
                requirement_type=rtype,
                target_count=target,
                xp_reward=xp,
                expires_at=expiry
            )
            db.add(q)
        await db.flush() # Ensure they are saved for the response
        # Re-fetch them
        quests_result = await db.execute(
            select(DailyQuest).where(DailyQuest.user_id == user_id, DailyQuest.expires_at > now)
        )
        active_quests = quests_result.scalars().all()

    # Auto-migrate old quest titles to new ones
    rename_map = {
        "Quiz Master": "Arena Challenger",
        "Chapter Explorer": "Dungeon Delver",
        "Chatty Learner": "Wisdom Trials",
        "Relic Hunter": "Dungeon Delver",
        "Oracle's Whisper": "Wisdom Trials"
    }
    for q in active_quests:
        if q.title in rename_map:
            q.title = rename_map[q.title]
    
    if any(q.title in rename_map for q in active_quests):
        await db.commit() # Save the renamed titles

    # Get earned badges (reuse existing list logic)
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

    await db.commit()

    # Calculate RPG Stats
    # 1. Logic (STEM subjects)
    logical_subjects = ['Mathematics', 'Computer Science', 'Physics', 'Machine Learning', 'Logic', 'JEE Main']
    logic_query = select(func.avg(QuizSession.score)).where(
        QuizSession.user_id == user_id,
        QuizSession.subject.in_(logical_subjects),
        QuizSession.status == "completed"
    )
    logic_avg = await db.scalar(logic_query) or 0
    
    # 2. Memory (Overall consistency)
    memory_query = select(func.avg(QuizSession.score)).where(
        QuizSession.user_id == user_id,
        QuizSession.status == "completed"
    )
    memory_avg = await db.scalar(memory_query) or 0

    # 3. Grind (Effort: XP + Streak)
    grind_val = min(100, (user_xp.total_xp // 100) + (user_streak.current_streak if user_streak else 0) * 10)

    stats = RPGStats(
        logic=int(logic_avg),
        memory=int(memory_avg),
        grind=int(grind_val)
    )

    # --- Inventory Logic ---
    inventory_res = await db.execute(
        select(PowerUp, UserInventory.quantity)
        .join(UserInventory, UserInventory.power_up_id == PowerUp.id)
        .where(UserInventory.user_id == user_id)
    )
    inventory_out = []
    for item, qty in inventory_res.all():
        inventory_out.append(PowerUpOut(
            item_key=item.item_key,
            name=item.name,
            description=item.description,
            cost=item.cost,
            icon=item.icon,
            quantity=qty
        ))

    # --- Guild Logic ---
    guild_out = None
    if user_xp.guild_id:
        guild_res = await db.execute(select(Guild).where(Guild.id == user_xp.guild_id))
        guild = guild_res.scalar_one_or_none()
        if guild:
            guild_out = GuildOut.from_orm(guild)

    return GamificationProfile(
        total_xp=user_xp.total_xp,
        level=user_xp.level,
        coins=user_xp.coins or 0,
        xp_to_next_level=xp_to_next_level(user_xp.total_xp, user_xp.level),
        badges=badges_out,
        streak=StreakOut.from_orm(user_streak) if user_streak else None,
        active_quests=[QuestOut.from_orm(q) for q in active_quests],
        inventory=inventory_out,
        stats=stats,
        guild=guild_out
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
    """Internal function to process XP, Coins and badges."""
    xp_awarded = 0
    coins_awarded = 0
    
    if event == "quiz_complete":
        xp_awarded = 10
        coins_awarded = 5
        if score is not None and score >= 80:
            xp_awarded += 15  # High score bonus
            coins_awarded += 10
    elif event == "chapter_complete":
        xp_awarded = 25
        coins_awarded = 20
    elif event == "streak_daily":
        xp_awarded = 15
        coins_awarded = 10
    elif event == "chat_interaction":
        xp_awarded = 2
        coins_awarded = 1
        
    if xp_awarded == 0:
        return {"message": "No XP awarded for this event."}
        
    # Get or create UserXP
    result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    user_xp = result.scalar_one_or_none()
    
    if not user_xp:
        user_xp = UserXP(user_id=user_id, total_xp=0, level=1, coins=0)
        db.add(user_xp)
    
    # Apply streak multiplier if possible
    streak_res = await db.execute(select(UserStreak).where(UserStreak.user_id == user_id))
    user_streak = streak_res.scalar_one_or_none()
    multiplier = user_streak.streak_multiplier if user_streak else 1.0
    
    actual_xp = int(xp_awarded * multiplier)
    user_xp.total_xp += actual_xp
    user_xp.coins = (user_xp.coins or 0) + coins_awarded
    
    # --- Quest Progress Update ---
    # Find quests matching the event type
    q_type_map = {
        "quiz_complete": "quiz",
        "chapter_complete": "chapter",
        "chat_interaction": "chat"
    }
    rtype = q_type_map.get(event)
    if rtype:
        now = datetime.utcnow()
        quests_result = await db.execute(
            select(DailyQuest).where(
                DailyQuest.user_id == user_id, 
                DailyQuest.requirement_type == rtype,
                DailyQuest.is_completed.is_(False),
                DailyQuest.expires_at > now
            )
        )
        for q in quests_result.scalars():
            q.current_count += 1
            if q.current_count >= q.target_count:
                q.is_completed = True
                user_xp.total_xp += q.xp_reward
                user_xp.coins = (user_xp.coins or 0) + 10 # Quest coin bonus
    
    # Check level up
    new_level = calculate_level(user_xp.total_xp)
    leveled_up = new_level > user_xp.level
    user_xp.level = new_level
    
    await db.commit()
    
    # Badge checking logic
    badges_awarded = []
    
    # Level Milestones
    if leveled_up:
        # Mystery reward box (e.g. 50 extra coins on level up)
        user_xp.coins += 50
        
        milestones = {
            2: ("level_2", "Level Explorer", "Reached Level 2", "🌱"),
            3: ("level_3", "Knowledge Seeker", "Reached Level 3", "📜"),
            4: ("level_4", "Consistent Learner", "Reached Level 4", "🔋"),
            5: ("level_5", "Dedicated Scholar", "Reached Level 5", "🎖️")
        }
        if new_level in milestones:
            await _award_badge_if_earned(db, user_id, *milestones[new_level], badges_awarded)
        
    if event == "quiz_complete" and score is not None and score == 100:
        await _award_badge_if_earned(db, user_id, "perfect_score", "Flawless Victory", "Scored 100% on a quiz", "🎯", badges_awarded)
        
    return {
        "awarded_xp": actual_xp,
        "awarded_coins": coins_awarded,
        "multiplier": multiplier,
        "new_total_xp": user_xp.total_xp,
        "new_total_coins": user_xp.coins,
        "level": user_xp.level,
        "leveled_up": leveled_up,
        "badges_awarded": badges_awarded
    }

async def _seed_power_ups(db: AsyncSession):
    items = [
        ("focus_potion", "Focus Potion", "Dims UI distractions for 15 mins", 150, "🧪"),
        ("time_warp", "Time Warp", "+10 mins extra in Test Center", 200, "⏳"),
        ("hint_gem", "Hint Gem", "Reveal part of an answer", 100, "💎"),
        ("shield", "XP Shield", "Prevent losing XP on quiz failure", 300, "🛡️")
    ]
    for key, name, desc, cost, icon in items:
        res = await db.execute(select(PowerUp).where(PowerUp.item_key == key))
        if not res.scalar_one_or_none():
            db.add(PowerUp(item_key=key, name=name, description=desc, cost=cost, icon=icon))
    await db.commit()

@router.post("/buy-powerup")
async def buy_powerup(
    item_key: str,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.user_id
    xp_res = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    user_xp = xp_res.scalar_one_or_none()
    if not user_xp:
        raise HTTPException(status_code=404, detail="User profile not found")
    p_res = await db.execute(select(PowerUp).where(PowerUp.item_key == item_key))
    item = p_res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if (user_xp.coins or 0) < item.cost:
        raise HTTPException(status_code=400, detail="Insufficient coins")
    user_xp.coins -= item.cost
    inv_res = await db.execute(
        select(UserInventory).where(UserInventory.user_id == user_id, UserInventory.power_up_id == item.id)
    )
    inv = inv_res.scalar_one_or_none()
    if not inv:
        inv = UserInventory(user_id=user_id, power_up_id=item.id, quantity=1)
        db.add(inv)
    else:
        inv.quantity += 1
    await db.commit()
    return {"message": f"Successfully bought {item.name}", "remaining_coins": user_xp.coins}

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
@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    db: AsyncSession = Depends(get_db)
):
    """Get the top 20 users by XP."""
    result = await db.execute(
        select(User.full_name, UserXP.level, UserXP.total_xp, func.count(UserBadge.id).label("badges_count"))
        .join(UserXP, User.id == UserXP.user_id)
        .outerjoin(UserBadge, User.id == UserBadge.user_id)
        .group_by(User.id, UserXP.id)
        .order_by(desc(UserXP.total_xp))
        .limit(20)
    )
    
    entries = []
    for name, level, xp, count in result.all():
        entries.append(LeaderboardEntry(
            username=name or "Anonymous Scholar",
            level=level,
            total_xp=xp,
            badges_count=count
        ))
    return entries

@router.get("/guilds", response_model=List[GuildOut])
async def list_guilds(
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    await _seed_guilds(db)
    result = await db.execute(select(Guild))
    return result.scalars().all()

@router.post("/guilds/create")
async def create_guild(
    name: str, 
    description: str, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    user_id = current_user.user_id
    xp_res = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp = xp_res.scalar_one_or_none()
    
    if xp.guild_id:
        raise HTTPException(status_code=400, detail="Already in a guild")
    
    new_guild = Guild(name=name, description=description, member_count=1)
    db.add(new_guild)
    await db.commit()
    await db.refresh(new_guild)
    
    xp.guild_id = new_guild.id
    await db.commit()
    return {"message": "Guild created", "guild": new_guild}

@router.post("/guilds/join")
async def join_guild(
    guild_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    user_id = current_user.user_id
    xp_res = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp = xp_res.scalar_one_or_none()
    
    if xp.guild_id:
        raise HTTPException(status_code=400, detail="Already in a guild")
    
    guild_res = await db.execute(select(Guild).where(Guild.id == guild_id))
    guild = guild_res.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    
    xp.guild_id = guild.id
    guild.member_count += 1
    await db.commit()
    return {"message": "Joined guild", "guild": guild}

@router.post("/guilds/leave")
async def leave_guild(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.user_id
    xp_res = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp = xp_res.scalar_one_or_none()
    
    if not xp or not xp.guild_id:
        raise HTTPException(status_code=400, detail="Not in a guild")
    
    guild_id = xp.guild_id
    guild_res = await db.execute(select(Guild).where(Guild.id == guild_id))
    guild = guild_res.scalar_one_or_none()
    
    xp.guild_id = None
    if guild and guild.member_count > 0:
        guild.member_count -= 1
        
    await db.commit()
    return {"message": "Left guild"}

async def _seed_guilds(db: AsyncSession):
    chk = await db.execute(select(Guild).limit(1))
    if chk.scalar_one_or_none():
        return
    
    guild_data = [
        {"name": "The Sage Collective", "description": "Scholars dedicated to deep memory and wisdom.", "level": 10},
        {"name": "Logic Vanguard", "description": "Tactical problem solvers focusing on STEM mastery.", "level": 12},
        {"name": "Grinders Union", "description": "The most consistent students on NexusLearn.", "level": 8}
    ]
    for g in guild_data:
        db.add(Guild(**g))
    await db.commit()
