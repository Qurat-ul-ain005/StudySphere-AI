from sqlalchemy import Column, Integer, String, Text, ForeignKey

from app.database.database import Base


class StudyPlan(Base):

    __tablename__ = "study_plans"

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

    subject = Column(
        String,
        nullable=False
    )

    exam_date = Column(
        String,
        nullable=False
    )

    hours_per_day = Column(
        Integer,
        nullable=False
    )

    document_ids = Column(
        Text,
        nullable=False
    )

    study_plan = Column(
        Text,
        nullable=False
    )