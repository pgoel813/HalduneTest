from __future__ import annotations

import os

import anthropic
from anthropic import Anthropic


class LLMError(RuntimeError):
    """Raised when a language-model completion cannot be produced.

    Wraps any underlying Anthropic SDK error (timeout, rate limit, auth,
    connection, or API error) so callers get a single clear exception type
    instead of a raw SDK exception bubbling up.
    """


_client = None


def get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


DEFAULT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")


def complete(prompt: str, system: str | None = None, max_tokens: int = 1024) -> str:
    try:
        client = get_client()
        resp = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=max_tokens,
            system=system or "",
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in resp.content if block.type == "text")
    except anthropic.APITimeoutError as e:
        raise LLMError("Language model request timed out") from e
    except anthropic.RateLimitError as e:
        raise LLMError("Language model rate limit exceeded") from e
    except anthropic.AuthenticationError as e:
        raise LLMError("Language model authentication failed") from e
    except anthropic.APIConnectionError as e:
        raise LLMError("Could not connect to the language model service") from e
    except anthropic.APIError as e:
        raise LLMError(f"Language model API error: {e}") from e
    except Exception as e:
        raise LLMError(f"Unexpected language model error: {e}") from e
