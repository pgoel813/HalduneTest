"""End-to-end flow tests for the debrief API.

The LLM is always mocked here: ``quality_check`` (the doctrinal sufficiency
check) and ``generate_summary`` are patched so no test hits the real Anthropic
API. ``quality_check`` is patched at ``app.services.debrief_logic`` because
``decide_next`` calls it as a module global; ``generate_summary`` is patched at
``app.routers.debriefs`` where it is imported and used.
"""

from __future__ import annotations

from app.services.debrief_logic import QualityDecision

CREATE_BODY = {
    "operator_name": "SSG Reyes",
    "mission_name": "OP NIGHTFALL",
    "mission_date": "2026-07-15",
}


def _create(client) -> int:
    resp = client.post("/api/debriefs", json=CREATE_BODY)
    assert resp.status_code == 200
    return resp.json()["id"]


def _mock_quality(mocker, *, sufficient: bool, followup: str | None):
    return mocker.patch(
        "app.services.debrief_logic.quality_check",
        return_value=QualityDecision(sufficient=sufficient, followup_question=followup),
    )


def _answer(client, debrief_id: int, text: str):
    return client.post(f"/api/debriefs/{debrief_id}/answer", json={"answer_text": text})


def test_create_returns_first_question(client):
    resp = client.post("/api/debriefs", json=CREATE_BODY)
    assert resp.status_code == 200
    data = resp.json()

    assert data["current_question"]["topic"] == "mission_overview"
    assert data["current_question"]["question_text"].startswith(
        "State your mission, objective"
    )
    assert data["progress"] == {"current": 1, "total": 8}


def test_sufficient_answer_advances_to_next_topic(client, mocker):
    _mock_quality(mocker, sufficient=True, followup=None)
    debrief_id = _create(client)

    resp = _answer(client, debrief_id, "A specific, complete answer covering the 5 Ws.")
    assert resp.status_code == 200

    nxt = resp.json()["next"]
    assert nxt["type"] == "next_topic"
    assert nxt["topic"] == "execution_timeline"
    assert nxt["progress"] == {"current": 2, "total": 8}


def test_weak_answers_trigger_followups_then_cap_at_two(client, mocker):
    _mock_quality(mocker, sufficient=False, followup="Please add who/what/when/where/why.")
    debrief_id = _create(client)

    # 1st weak answer (to the primary) -> first follow-up, still on topic 1.
    r1 = _answer(client, debrief_id, "it went ok")
    assert r1.status_code == 200
    assert r1.json()["next"]["type"] == "followup"
    assert r1.json()["next"]["progress"]["current"] == 1

    # 2nd weak answer (to follow-up #1) -> second follow-up, still on topic 1.
    r2 = _answer(client, debrief_id, "we did the thing")
    assert r2.json()["next"]["type"] == "followup"
    assert r2.json()["next"]["progress"]["current"] == 1

    # 3rd weak answer (to follow-up #2) -> cap reached, force-advance to topic 2.
    r3 = _answer(client, debrief_id, "nothing to add")
    nxt = r3.json()["next"]
    assert nxt["type"] == "next_topic"
    assert nxt["topic"] == "execution_timeline"
    assert nxt["progress"]["current"] == 2


def test_complete_all_topics_sets_status_and_returns_summary(client, mocker):
    _mock_quality(mocker, sufficient=True, followup=None)
    mocker.patch(
        "app.routers.debriefs.generate_summary",
        return_value="## Sustain\n- Held the objective\n\n## Improve\n- Comms setup",
    )
    debrief_id = _create(client)

    step_types = []
    for i in range(8):
        resp = _answer(client, debrief_id, f"Sufficient answer for topic {i + 1}.")
        assert resp.status_code == 200
        step_types.append(resp.json()["next"]["type"])

    # First 7 answers advance to the next topic; the 8th completes the bank.
    assert step_types[:7] == ["next_topic"] * 7
    assert step_types[7] == "complete"

    complete_resp = client.post(f"/api/debriefs/{debrief_id}/complete")
    assert complete_resp.status_code == 200
    summary = complete_resp.json()["summary_markdown"]
    assert isinstance(summary, str) and summary.strip() != ""

    get_resp = client.get(f"/api/debriefs/{debrief_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "complete"


def test_get_nonexistent_debrief_returns_404(client):
    resp = client.get("/api/debriefs/99999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Debrief not found"


def test_answer_with_empty_text_returns_422(client):
    debrief_id = _create(client)
    resp = _answer(client, debrief_id, "   ")
    assert resp.status_code == 422
