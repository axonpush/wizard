---
name: anthropic
description: Integrate AxonPush tracing into a project using the Anthropic Python SDK
---

# AxonPush + Anthropic/Claude Integration

Integrate AxonPush tracing into a project using the Anthropic Python SDK.

## What gets added

- `AxonPushAnthropicTracer` that wraps `messages.create()` to trace conversations, tool use, and responses
- Events: `conversation.turn`, `tool.*.start`, `agent.response`, `tool.result`

## Reference Code (Sync)

```python
import os
from axonpush import AxonPush
from axonpush.integrations.anthropic import AxonPushAnthropicTracer

axonpush_client = AxonPush(
    api_key=os.environ["AXONPUSH_API_KEY"],
    tenant_id=os.environ["AXONPUSH_TENANT_ID"],
    base_url=os.environ.get("AXONPUSH_BASE_URL", "http://localhost:3000"),
)

tracer = AxonPushAnthropicTracer(
    client=axonpush_client,
    channel_id=1,  # Replace with your channel ID
    agent_id="claude-agent",
)

# Instead of: response = anthropic_client.messages.create(model=..., messages=...)
# Use:        response = tracer.create_message(anthropic_client, model=..., messages=...)
```

## Reference Code (Async)

```python
# Use AsyncAxonPush instead:
# response = await tracer.acreate_message(async_anthropic_client, model=..., messages=...)
```

## Steps

1. Install `axonpush[anthropic]` using the project's package manager
2. Add AXONPUSH_API_KEY, AXONPUSH_TENANT_ID, AXONPUSH_BASE_URL to .env
3. Find files that call `client.messages.create()` (the Anthropic API)
4. Add imports and create the tracer
5. Replace `anthropic_client.messages.create(...)` with `tracer.create_message(anthropic_client, ...)`
6. For tool results, add `tracer.send_tool_result(tool_use_id, result)` calls
