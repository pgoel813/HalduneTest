"""Core state machine for the post-mission debrief flow.

The flow walks the 8 fixed doctrinal topics in order. After each answer an LLM
quality check decides whether the answer is doctrinally sufficient. If it is
not (and the per-topic follow-up cap is not yet reached) a single targeted
follow-up is asked; otherwise the debrief advances to the next topic's primary
question, or completes after topic 8.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from app.services import doctrine
from app.services.llm import complete

MAX_FOLLOWUPS_PER_TOPIC = 2


@dataclass(frozen=True)
class QualityDecision:
    """Result of the LLM doctrinal-sufficiency check for one answer."""

    sufficient: bool
    followup_question: str | None


@dataclass(frozen=True)
class NextStep:
    """What the client should do after an answer is recorded."""

    type: str  # "followup" | "next_topic" | "complete"
    topic: str | None
    question_text: str | None
    progress_current: int
    progress_total: int


@dataclass(frozen=True)
class PendingTurn:
    """A question to be persisted and posed next."""

    topic: str
    question_text: str
    is_followup: bool
    order_index: int


def _extract_json(raw: str) -> str:
    """Best-effort extraction of a JSON object from an LLM response."""
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def get_next_question(session, turns) -> NextStep:
    """Determine the current pending question for a session from its turns.

    Reads the trailing unanswered turn (the current question). Returns a
    ``complete`` step when every topic has been answered and no question is
    pending.
    """
    pending = [t for t in turns if t.answer_text is None]
    if pending:
        current = pending[0]
        idx = doctrine.topic_index(current.topic)
        return NextStep(
            type="followup" if current.is_followup else "next_topic",
            topic=current.topic,
            question_text=current.question_text,
            progress_current=idx + 1,
            progress_total=doctrine.TOTAL_TOPICS,
        )
    return NextStep(
        type="complete",
        topic=None,
        question_text=None,
        progress_current=doctrine.TOTAL_TOPICS,
        progress_total=doctrine.TOTAL_TOPICS,
    )


def quality_check(topic: str, question_text: str, answer_text: str) -> QualityDecision:
    """Ask the LLM whether an answer is doctrinally sufficient for an AAR.

    Sufficiency means: specific, complete, and addressing the relevant
    who/what/when/where/why for the topic (not vague). The model is prompted to
    reply in strict JSON. On any parse failure we fall back to advancing (treat
    as sufficient) so a flaky LLM never stalls the debrief.
    """
    system = (
        "You are a strict Army/Marine Corps After Action Review (AAR) reviewer. "
        "You evaluate whether a debrief answer is doctrinally sufficient: specific, "
        "complete, and addressing the relevant who/what/when/where/why for the topic. "
        "Vague, evasive, or one-line answers are insufficient. Respond ONLY with JSON."
    )
    prompt = (
        f"Topic: {topic}\n"
        f"Question asked: {question_text}\n"
        f"Operator's answer: {answer_text}\n\n"
        "Decide if this answer is doctrinally sufficient. If it is NOT sufficient, "
        "write ONE targeted follow-up question that would elicit the missing "
        "specifics for this topic.\n\n"
        "Respond with strict JSON in exactly this shape and nothing else:\n"
        '{"sufficient": true|false, "followup_question": "..." | null}'
    )
    try:
        raw = complete(prompt, system=system, max_tokens=512)
        parsed = json.loads(_extract_json(raw))
        followup = parsed.get("followup_question")
        if isinstance(followup, str):
            followup = followup.strip() or None
        else:
            followup = None
        return QualityDecision(
            sufficient=bool(parsed.get("sufficient", True)),
            followup_question=followup,
        )
    except Exception:
        # Fail open: advance rather than block the operator on a bad LLM reply.
        return QualityDecision(sufficient=True, followup_question=None)


def _count_asked_followups(turns, topic: str) -> int:
    """Number of follow-up questions already asked (answered) for a topic."""
    return sum(
        1
        for t in turns
        if t.topic == topic and t.is_followup and t.answer_text is not None
    )


def decide_next(answered_turn, turns) -> tuple[NextStep, PendingTurn | None]:
    """Given the just-answered turn (and all turns), decide what comes next.

    ``turns`` must already include ``answered_turn`` with its answer set.
    Returns the ``NextStep`` for the client plus the ``PendingTurn`` to persist
    (or ``None`` when the debrief is complete).
    """
    topic = answered_turn.topic
    idx = doctrine.topic_index(topic)
    total = doctrine.TOTAL_TOPICS
    next_order = max((t.order_index for t in turns), default=-1) + 1

    decision = quality_check(topic, answered_turn.question_text, answered_turn.answer_text)
    asked_followups = _count_asked_followups(turns, topic)

    if (
        not decision.sufficient
        and decision.followup_question
        and asked_followups < MAX_FOLLOWUPS_PER_TOPIC
    ):
        pending = PendingTurn(
            topic=topic,
            question_text=decision.followup_question,
            is_followup=True,
            order_index=next_order,
        )
        step = NextStep(
            type="followup",
            topic=topic,
            question_text=decision.followup_question,
            progress_current=idx + 1,
            progress_total=total,
        )
        return step, pending

    next_idx = idx + 1
    if next_idx < total:
        entry = doctrine.QUESTION_BANK[next_idx]
        pending = PendingTurn(
            topic=entry["topic"],
            question_text=entry["question_text"],
            is_followup=False,
            order_index=next_order,
        )
        step = NextStep(
            type="next_topic",
            topic=entry["topic"],
            question_text=entry["question_text"],
            progress_current=next_idx + 1,
            progress_total=total,
        )
        return step, pending

    step = NextStep(
        type="complete",
        topic=None,
        question_text=None,
        progress_current=total,
        progress_total=total,
    )
    return step, None
