import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.session import init_db
from app.routers import debriefs

load_dotenv()

logger = logging.getLogger("app")

# Known placeholder values that must not be accepted as a real API key.
_PLACEHOLDER_API_KEYS = {
    "your-api-key",
    "your-api-key-here",
    "your_api_key_here",
    "changeme",
    "placeholder",
    "sk-ant-xxx",
    "sk-ant-placeholder",
}


def _validate_api_key() -> None:
    """Ensure ANTHROPIC_API_KEY is present and not a placeholder.

    Raised at startup so the failure is loud and immediate rather than
    surfacing later on the first LLM call.
    """
    key = os.environ.get("ANTHROPIC_API_KEY")
    normalized = (key or "").strip()
    lowered = normalized.lower()
    is_placeholder = (
        not normalized
        or lowered in _PLACEHOLDER_API_KEYS
        or "your-api-key" in lowered
        or "placeholder" in lowered
        or "changeme" in lowered
    )
    if is_placeholder:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is missing or set to a placeholder value. "
            "Set a real Anthropic API key in the environment (or .env) before "
            "starting the server."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast if the LLM credentials are not configured.
    _validate_api_key()
    # Create tables on startup (models are imported via the routers).
    init_db()
    yield


app = FastAPI(title="Haldune Test API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled errors.

    Logs the real error (with traceback) server-side and returns a generic
    message so no stack trace or internal detail is leaked to the client.
    """
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500, content={"error": "internal server error"}
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(debriefs.router)
