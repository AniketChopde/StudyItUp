"""
Gamification models – UserXP, Badge, UserBadge.
"""

from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database.connection import Base
from database.types import UUID, JSON
from pydantic import BaseModel, Field
from typing import List, Optional


class UserXP(Base):
    """Tracks a user's total XP and computed level."""

    __tablename__ = "user_xp"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    coins = Column(Integer, default=0)
    guild_id = Column(UUID, ForeignKey("guilds.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="user_xp")


class Badge(Base):
    """A learnable achievement badge."""

    __tablename__ = "badges"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    badge_key = Column(String(100), unique=True, nullable=False)  # e.g. 'first_quiz'
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=False)
    icon = Column(String(50), default="🏆")   # emoji or icon name
    xp_threshold = Column(Integer, default=0)  # 0 = event-based, >0 = XP milestone
    created_at = Column(DateTime, default=datetime.utcnow)

    earned_by = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    """Join table: a badge unlocked by a specific user."""

    __tablename__ = "user_badges"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(UUID, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="earned_by")


class UserStreak(Base):
    """Tracks a user's login streaks."""

    __tablename__ = "user_streaks"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    streak_multiplier = Column(Float, default=1.0)
    streak_shields = Column(Integer, default=0)
    last_activity_date = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")


class PowerUp(Base):
    """Items purchasable in the Study Armoury."""

    __tablename__ = "power_ups"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    item_key = Column(String(50), unique=True, nullable=False)  # focus_potion, time_warp, hint_gem, shield
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    cost = Column(Integer, default=100)
    icon = Column(String(50), default="🧪")


class UserInventory(Base):
    """Items owned by a specific user."""

    __tablename__ = "user_inventory"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    power_up_id = Column(UUID, ForeignKey("power_ups.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=0)

    user = relationship("User")
    power_up = relationship("PowerUp")


class Guild(Base):
    """A collection of users working towards shared goals."""

    __tablename__ = "guilds"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))
    level = Column(Integer, default=1)
    total_xp = Column(Integer, default=0)
    member_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class DailyQuest(Base):
    """Daily tasks for users to earn XP."""

    __tablename__ = "daily_quests"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    requirement_type = Column(String(50), nullable=False)  # quiz, chapter, chat
    target_count = Column(Integer, default=1)
    current_count = Column(Integer, default=0)
    xp_reward = Column(Integer, default=50)
    is_completed = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class BadgeOut(BaseModel):
    badge_key: str
    name: str
    description: str
    icon: str
    earned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    streak_multiplier: float
    streak_shields: int
    last_activity_date: datetime

    class Config:
        from_attributes = True


class GuildOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    level: int
    total_xp: int
    member_count: int

    class Config:
        from_attributes = True


class QuestOut(BaseModel):
    id: uuid.UUID
    title: str
    requirement_type: str
    target_count: int
    current_count: int
    xp_reward: int
    is_completed: bool
    expires_at: datetime

    class Config:
        from_attributes = True


class RPGStats(BaseModel):
    logic: int = Field(0, ge=0, le=100)
    memory: int = Field(0, ge=0, le=100)
    grind: int = Field(0, ge=0, le=100)


class PowerUpOut(BaseModel):
    item_key: str
    name: str
    description: str
    cost: int
    icon: str
    quantity: int = 0

    class Config:
        from_attributes = True


class GamificationProfile(BaseModel):
    total_xp: int
    level: int
    coins: int
    xp_to_next_level: int
    badges: List[BadgeOut]
    streak: Optional[StreakOut] = None
    active_quests: List[QuestOut] = []
    inventory: List[PowerUpOut] = []
    stats: RPGStats = RPGStats()
    guild: Optional[GuildOut] = None


class XPAwardRequest(BaseModel):
    event: str = Field(..., description="quiz_complete | chapter_complete | streak | high_score")
    score: Optional[float] = Field(None, description="Score percent – used to decide high_score bonus")


class LeaderboardEntry(BaseModel):
    username: str
    level: int
    total_xp: int
    badges_count: int
