"""Shared pytest fixtures for the backend test suite.

Provides a FastAPI TestClient backed by a fresh in-memory SQLite database with
the ``get_session`` dependency overridden, so tests never touch the real
``app.db``. The client is instantiated without the lifespan context manager so
startup hooks (API-key validation, real ``init_db``) do not run.
"""

import os
import sys

# Make the backend package importable regardless of how pytest is invoked.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.db.session import get_session
from app.main import app

# Ensure the models are registered on SQLModel.metadata before create_all.
from app.models.debrief import DebriefSession, DebriefTurn  # noqa: F401


@pytest.fixture(name="client")
def client_fixture():
    """A TestClient wired to a fresh in-memory SQLite database per test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # single shared connection keeps the in-memory DB alive
    )
    SQLModel.metadata.create_all(engine)

    def get_session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_session_override

    # Plain instantiation (no `with`) so the app lifespan does not run.
    client = TestClient(app)
    try:
        yield client
    finally:
        app.dependency_overrides.clear()
        SQLModel.metadata.drop_all(engine)
        engine.dispose()
