---
name: core
description: Integrate AxonPush event publishing directly without framework-specific callbacks
---

# AxonPush Core SDK Integration

Integrate AxonPush event publishing directly (no framework-specific callbacks).

## What gets added

- `AxonPush` client for publishing custom events
- Use `client.events.publish()` to send events from anywhere in your code

## Reference Code

```python
import os
from axonpush import AxonPush, EventType

axonpush_client = AxonPush(
    api_key=os.environ["AXONPUSH_API_KEY"],
    tenant_id=os.environ["AXONPUSH_TENANT_ID"],
    base_url=os.environ.get("AXONPUSH_BASE_URL", "http://localhost:3000"),
)

# Publish events from your code:
# axonpush_client.events.publish(
#     identifier="my.event",
#     payload={"key": "value"},
#     channel_id=1,
#     agent_id="my-agent",
#     event_type=EventType.CUSTOM,
# )
```

## Steps

1. Install `axonpush` using the project's package manager
2. Add AXONPUSH_API_KEY, AXONPUSH_TENANT_ID, AXONPUSH_BASE_URL to .env
3. Find the main entry point of the project
4. Add imports and create the client as a module-level singleton
5. Add example publish calls at key points (e.g., start, end, error handling)
