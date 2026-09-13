from sqlalchemy import Column, Integer, Text, ForeignKey

from app.database.database import Base


class Quiz(Base):

    __tablename__ = "quizzes"

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

    quiz_content = Column(
        Text,
        nullable=False
    )