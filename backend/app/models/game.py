from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class GameType(str, enum.Enum):
    JEOPARDY = "jeopardy"
    FEUD = "feud"
    CONNECTIONS = "connections"

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    game_type = Column(Enum(GameType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    data = Column(JSON)  # Store game-specific data
    is_public = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="games")
    scores = relationship("Score", back_populates="game", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Game {self.title} ({self.game_type})>"