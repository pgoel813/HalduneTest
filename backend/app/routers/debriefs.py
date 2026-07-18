"""API endpoints for post-mission debriefs (see CONTRACT.md)."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.debrief import DebriefSession, DebriefTurn
from app.services import debrief_logic, doctrine
from app.services.summary import generate_summary

router = APIRouter(prefix="/api/debriefs", tags=["debriefs"])


def _require_non_empty(value: str, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} must not be empty")
    return value.strip()


class CreateDebriefRequest(BaseModel):
    operator_name: str
    mission_name: str
    mission_date: str

    @field_validator("operator_name")
    @classmethod
    def _validate_operator_name(cls, v: str) -> str:
        return _require_non_empty(v, "operator_name")

    @field_validator("mission_name")
    @classmethod
    def _validate_mission_name(cls, v: str) -> str:
        return _require_non_empty(v, "mission_name")

    @field_validator("mission_date")
    @classmethod
    def _validate_mission_date(cls, v: str) -> str:
        v = _require_non_empty(v, "mission_date")
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError(
                "mission_date must be a valid ISO date (YYYY-MM-DD)"
            )
        return v


class AnswerRequest(BaseModel):
    answer_text: str

    @field_validator("answer_text")
    @classmethod
    def _validate_answer_text(cls, v: str) -> str:
        return _require_non_empty(v, "answer_text")


def _serialize_turn(turn: DebriefTurn) -> dict:
    return {
        "id": turn.id,
        "topic": turn.topic,
        "question_text": turn.question_text,
        "answer_text": turn.answer_text,
        "is_followup": turn.is_followup,
        "order_index": turn.order_index,
    }


def _load_turns(session: Session, debrief_id: int) -> list[DebriefTurn]:
    return list(
        session.exec(
            select(DebriefTurn)
            .where(DebriefTurn.session_id == debrief_id)
            .order_by(DebriefTurn.order_index)
        ).all()
    )


@router.post("")
def create_debrief(body: CreateDebriefRequest, session: Session = Depends(get_session)):
    debrief = DebriefSession(
        operator_name=body.operator_name,
        mission_name=body.mission_name,
        mission_date=body.mission_date,
    )
    session.add(debrief)
    session.commit()
    session.refresh(debrief)

    first = doctrine.QUESTION_BANK[0]
    turn = DebriefTurn(
        session_id=debrief.id,
        topic=first["topic"],
        question_text=first["question_text"],
        is_followup=False,
        order_index=0,
    )
    session.add(turn)
    session.commit()

    return {
        "id": debrief.id,
        "current_question": {
            "topic": first["topic"],
            "question_text": first["question_text"],
        },
        "progress": {"current": 1, "total": doctrine.TOTAL_TOPICS},
    }


@router.get("")
def list_debriefs(session: Session = Depends(get_session)):
    rows = session.exec(
        select(DebriefSession).order_by(DebriefSession.created_at.desc())
    ).all()
    return [
        {
            "id": r.id,
            "operator_name": r.operator_name,
            "mission_name": r.mission_name,
            "mission_date": r.mission_date,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.get("/{debrief_id}")
def get_debrief(debrief_id: int, session: Session = Depends(get_session)):
    debrief = session.get(DebriefSession, debrief_id)
    if debrief is None:
        raise HTTPException(status_code=404, detail="Debrief not found")

    turns = _load_turns(session, debrief_id)
    return {
        "id": debrief.id,
        "operator_name": debrief.operator_name,
        "mission_name": debrief.mission_name,
        "mission_date": debrief.mission_date,
        "status": debrief.status,
        "turns": [_serialize_turn(t) for t in turns],
        "summary": debrief.summary,
    }


@router.post("/{debrief_id}/answer")
def answer_debrief(
    debrief_id: int,
    body: AnswerRequest,
    session: Session = Depends(get_session),
):
    debrief = session.get(DebriefSession, debrief_id)
    if debrief is None:
        raise HTTPException(status_code=404, detail="Debrief not found")

    turns = _load_turns(session, debrief_id)
    pending = [t for t in turns if t.answer_text is None]
    if not pending:
        raise HTTPException(
            status_code=400, detail="Debrief has no pending question to answer"
        )

    current = pending[0]
    current.answer_text = body.answer_text
    session.add(current)
    session.commit()
    session.refresh(current)

    # Re-load so the just-answered turn is reflected in the decision.
    turns = _load_turns(session, debrief_id)
    step, next_pending = debrief_logic.decide_next(current, turns)

    if next_pending is not None:
        new_turn = DebriefTurn(
            session_id=debrief_id,
            topic=next_pending.topic,
            question_text=next_pending.question_text,
            is_followup=next_pending.is_followup,
            order_index=next_pending.order_index,
        )
        session.add(new_turn)
        session.commit()

    return {
        "next": {
            "type": step.type,
            "topic": step.topic,
            "question_text": step.question_text,
            "progress": {
                "current": step.progress_current,
                "total": step.progress_total,
            },
        }
    }


@router.post("/{debrief_id}/complete")
def complete_debrief(debrief_id: int, session: Session = Depends(get_session)):
    debrief = session.get(DebriefSession, debrief_id)
    if debrief is None:
        raise HTTPException(status_code=404, detail="Debrief not found")

    turns = _load_turns(session, debrief_id)
    answered = [t for t in turns if t.answer_text is not None]

    summary_markdown = generate_summary(debrief, answered)
    debrief.summary = summary_markdown
    debrief.status = "complete"
    session.add(debrief)
    session.commit()

    return {"summary_markdown": summary_markdown}
