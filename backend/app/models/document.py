from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from datetime import datetime, timezone
from app.database.database import Base


class Document(Base):

    __tablename__ = "documents"

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
        String,
        nullable=False
    )

    extracted_text = Column(
        Text,
        nullable=True
    )

    summary = Column(
        Text,
        nullable=True
    )

    uploaded_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=True
    )