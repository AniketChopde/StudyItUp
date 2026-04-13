from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database.connection import Base
from database.types import UUID, JSON

class AnimationCache(Base):
    """Global cache for generated animations to avoid duplicate API calls."""
    __tablename__ = "animation_cache"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    topic = Column(String(255), unique=True, nullable=False, index=True)
    exam_type = Column(String(100), default="General")
    viz_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user_animations = relationship("UserAnimation", back_populates="animation")

class UserAnimation(Base):
    """User-specific generated animations (Video Library)."""
    __tablename__ = "user_animations"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    animation_id = Column(UUID, ForeignKey("animation_cache.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(255), nullable=False)  # Denormalized for rapid listing
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="animations")
    animation = relationship("AnimationCache", back_populates="user_animations")
