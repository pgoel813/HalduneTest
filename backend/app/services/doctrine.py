"""Doctrinal question bank for post-mission debriefs.

The 8 topics are fixed and ordered per CONTRACT.md. Order matters: a debrief
walks through them sequentially from index 0 to 7.
"""

QUESTION_BANK: list[dict[str, str]] = [
    {
        "topic": "mission_overview",
        "question_text": "State your mission, objective, and assigned tasks for this operation.",
    },
    {
        "topic": "execution_timeline",
        "question_text": "Walk through the sequence of events from mission start to completion.",
    },
    {
        "topic": "enemy_contact",
        "question_text": "Describe any enemy contact, threats encountered, and actions taken.",
    },
    {
        "topic": "communications",
        "question_text": "Were communications maintained throughout? Note any failures or gaps.",
    },
    {
        "topic": "equipment_logistics",
        "question_text": "Report equipment status, malfunctions, and logistics issues.",
    },
    {
        "topic": "coordination_command",
        "question_text": "Describe coordination with higher command, adjacent units, or supporting elements.",
    },
    {
        "topic": "plan_deviations",
        "question_text": "What deviated from the original plan, and why?",
    },
    {
        "topic": "lessons_learned",
        "question_text": "What should be sustained, and what should be improved for future missions?",
    },
]

TOTAL_TOPICS: int = len(QUESTION_BANK)


def topic_index(topic: str) -> int:
    """Return the 0-based index of a topic in the ordered bank, or -1."""
    for i, entry in enumerate(QUESTION_BANK):
        if entry["topic"] == topic:
            return i
    return -1
