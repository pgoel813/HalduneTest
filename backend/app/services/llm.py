from __future__ import annotations

import os
from anthropic import Anthropic

_client = None

def get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client

DEFAULT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

def complete(prompt: str, system: str | None = None, max_tokens: int = 1024) -> str:
    client = get_client()
    resp = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=max_tokens,
        system=system or "",
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(block.text for block in resp.content if block.type == "text")
