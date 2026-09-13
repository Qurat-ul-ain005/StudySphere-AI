from sqlalchemy import Column, Integer, Float, ForeignKey

from app.database.database import Base


class QuizResult(Base):

    __tablename__ = "quiz_results"

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

    quiz_id = Column(
        Integer,
        ForeignKey("quizzes.id"),
        nullable=True
    )

    score = Column(
        Integer,
        nullable=False
    )

    total_questions = Column(
        Integer,
        nullable=False
    )

    percentage = Column(
        Float,
        nullable=False
    )