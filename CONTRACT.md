# API Contract - Post-Mission Debrief Tool

## Doctrinal Question Bank (8 fixed topics, order matters)
1. mission_overview: "State your mission, objective, and assigned tasks for this operation."
2. execution_timeline: "Walk through the sequence of events from mission start to completion."
3. enemy_contact: "Describe any enemy contact, threats encountered, and actions taken."
4. communications: "Were communications maintained throughout? Note any failures or gaps."
5. equipment_logistics: "Report equipment status, malfunctions, and logistics issues."
6. coordination_command: "Describe coordination with higher command, adjacent units, or supporting elements."
7. plan_deviations: "What deviated from the original plan, and why?"
8. lessons_learned: "What should be sustained, and what should be improved for future missions?"

## Endpoints
POST /api/debriefs {operator_name, mission_name, mission_date} -> {id, current_question: {topic, question_text}, progress: {current:1, total:8}}
GET /api/debriefs -> [{id, operator_name, mission_name, mission_date, status, created_at}]
GET /api/debriefs/{id} -> {id, operator_name, mission_name, mission_date, status, turns: [{id, topic, question_text, answer_text, is_followup, order_index}], summary}
POST /api/debriefs/{id}/answer {answer_text} -> {next: {type: "followup"|"next_topic"|"complete", topic, question_text, progress: {current, total}}}
POST /api/debriefs/{id}/complete -> {summary_markdown}

## Quality check logic (backend, via LLM)
On each answer: LLM checks if answer is doctrinally sufficient (specific, complete, addresses who/what/when/where/why relevant to topic).
If insufficient AND fewer than 2 follow-ups already asked on this topic -> generate ONE targeted follow-up question, save turn with is_followup=true.
Else -> advance to next topic's primary question (or "complete" if topic 8 done).
