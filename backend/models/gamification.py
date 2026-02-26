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


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class BadgeOut(BaseModel):
    badge_key: str
    name: str
    description: str
    icon: str
    earned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GamificationProfile(BaseModel):
    total_xp: int
    level: int
    xp_to_next_level: int
    badges: List[BadgeOut]


class XPAwardRequest(BaseModel):
    event: str = Field(..., description="quiz_complete | chapter_complete | streak | high_score")
    score: Optional[float] = Field(None, description="Score percent – used to decide high_score bonus")
