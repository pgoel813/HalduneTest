# Post-Mission Debrief Tool

## Overview

A post-mission debrief tool for military operators. It walks the operator through 8 fixed doctrinal AAR (After Action Review) topics one at a time. After each answer, an LLM quality-checks it for doctrinal sufficiency — whether it is specific and addresses the relevant who/what/when/where/why — and asks up to 2 targeted follow-up questions per topic when an answer is vague or incomplete, before advancing to the next topic. Once all 8 topics are covered, it generates a structured AAR summary report.

## Architecture

- Backend: Python, FastAPI, SQLModel (SQLite), Anthropic Claude API
- Frontend: React, TypeScript, Vite, Tailwind CSS v4, React Router
- The full API contract is in [CONTRACT.md](CONTRACT.md)

## Model used

The backend reads `ANTHROPIC_MODEL` from `backend/.env`. The configured value is:

```
claude-sonnet-5
```

Model behavior may vary — this was built and tested against claude-sonnet-5.

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then add a real ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # defaults to http://localhost:8000, adjust if needed
npm run dev
```

Then open http://localhost:5173

### Running tests

```bash
cd backend && source .venv/bin/activate && pytest -v
```

## Features

- 8-topic doctrinal debrief flow with LLM-driven quality checks and follow-ups (capped at 2 per topic)
- AI-generated structured AAR summary (Sustain / Improve / Key Events / Recommendations)
- Full audit-trail transcript view per debrief
- Search/filter past debriefs by operator, mission name, or status
- Print-friendly AAR report export
- Tactical dark-theme UI built for operator use, with accessibility support (aria labels, keyboard submission, screen-reader live regions)

## Known limitations

- No authentication or multi-user support — single-operator local tool as built
- SQLite is used for simplicity; not intended for concurrent production-scale use
- The LLM quality-check is a single-pass heuristic, not a doctrine-certified evaluator — it should assist, not replace, a qualified debrief facilitator
- No automated frontend test suite (backend has pytest coverage of the core state machine)

## API Reference

See [CONTRACT.md](CONTRACT.md) for the full endpoint specification and doctrinal question bank.
