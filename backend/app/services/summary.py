"""AAR-style markdown summary generation for a completed debrief."""

from app.services.llm import complete


def generate_summary(session, turns) -> str:
    """Generate a structured After Action Review in markdown from all turns.

    Produces the four standard AAR sections: Sustain, Improve, Key Events, and
    Recommendations. ``turns`` should be the answered turns in order.
    """
    transcript_parts = []
    for t in turns:
        marker = " (follow-up)" if t.is_followup else ""
        transcript_parts.append(
            f"### Topic: {t.topic}{marker}\n"
            f"Q: {t.question_text}\n"
            f"A: {t.answer_text or '(no answer)'}"
        )
    transcript = "\n\n".join(transcript_parts)

    system = (
        "You are a US Army/Marine Corps After Action Review (AAR) analyst. You "
        "distill a post-mission debrief transcript into a concise, doctrinally "
        "structured AAR in GitHub-flavored markdown. Be specific and cite details "
        "from the transcript. Do not invent facts."
    )
    prompt = (
        f"Mission: {session.mission_name}\n"
        f"Operator: {session.operator_name}\n"
        f"Date: {session.mission_date}\n\n"
        "Produce an After Action Review in markdown with exactly these four "
        "second-level sections, in this order:\n"
        "## Sustain\n## Improve\n## Key Events\n## Recommendations\n\n"
        "Use bullet points under each section. Base everything on the debrief "
        "transcript below.\n\n"
        f"---\nDEBRIEF TRANSCRIPT\n---\n{transcript}"
    )
    return complete(prompt, system=system, max_tokens=2048)
