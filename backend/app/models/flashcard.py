from sqlalchemy import Column, Integer, Text, ForeignKey

from app.database.database import Base


class Flashcard(Base):

    __tablename__ = "flashcards"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    filename = Column(
        Text,
        nullable=True
    )

    flashcards_content = Column(
        Text,
        nullable=False
    )