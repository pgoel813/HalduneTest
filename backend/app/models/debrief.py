from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class DebriefSession(SQLModel, table=True):
    """A single post-mission debrief conversation."""

    id: Optional[int] = Field(default=None, primary_key=True)
    operator_name: str
    mission_name: str
    mission_date: str
    status: str = Field(default="in_progress")
    summary: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class DebriefTurn(SQLModel, table=True):
    """A single question/answer exchange within a debrief.

    A turn is created when a question is posed (``answer_text`` is ``None``)
    and completed when the operator responds. The trailing unanswered turn,
    if any, represents the current question awaiting an answer.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="debriefsession.id", index=True)
    topic: str
    question_text: str
    answer_text: Optional[str] = Field(default=None)
    is_followup: bool = Field(default=False)
    order_index: int
