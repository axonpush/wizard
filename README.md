# @axonpush/wizard

AI-powered wizard that integrates the [AxonPush](https://axonpush.xyz) SDK into your AI agent project using Claude Code. Supports both Python and TypeScript projects.

## Usage

```bash
npx @axonpush/wizard
```

The wizard will:

1. Detect your project language (Python or TypeScript) and AI framework
2. Ask for your AxonPush credentials (browser login or manual API key)
3. Use Claude Code to install the SDK, create apps/channels, and add integration code

## Options

```
--language, -l      Project language (python, typescript). Auto-detected if omitted.
--integration, -i   Framework integration(s), comma-separated. See tables below.
--api-key           AxonPush API key
--tenant-id         AxonPush tenant/organization ID
--base-url          AxonPush API URL (default: https://api.axonpush.xyz)
--app-url           AxonPush dashboard URL used for browser auth (default: https://app.axonpush.xyz)
--install-dir       Project directory (default: current directory)
```

`--base-url` and `--app-url` also accept env-var fallbacks: `AXONPUSH_BASE_URL` and `AXONPUSH_APP_URL`.

## Self-hosted axonpush

Point the wizard at your own deployment:

```bash
npx @axonpush/wizard \
  --base-url https://api.your-domain \
  --app-url  https://app.your-domain
```

Or via environment variables (handy for CI):

```bash
export AXONPUSH_BASE_URL=https://api.your-domain
export AXONPUSH_APP_URL=https://app.your-domain
npx @axonpush/wizard
```

## Non-interactive

```bash
npx @axonpush/wizard \
  --language typescript \
  --integration vercel-ai \
  --api-key ak_your_key \
  --tenant-id 1
```

## Supported Frameworks

### Python

| Framework | Install | Integration |
|-----------|---------|-------------|
| LangChain / LangGraph | `axonpush[langchain]` | Callback handler for chains and agents |
| OpenAI Agents SDK | `axonpush[openai-agents]` | Run hooks for agent lifecycle |
| Anthropic / Claude | `axonpush[anthropic]` | Tracer wrapping messages.create() |
| CrewAI | `axonpush[crewai]` | Step and task callbacks |
| Deep Agents | `axonpush[deepagents]` | Callback handler with deep agent awareness |
| Custom | `axonpush` | Direct event publishing |

### TypeScript

| Framework | Install | Integration |
|-----------|---------|-------------|
| LangChain | `@axonpush/sdk` | `AxonPushCallbackHandler` for chains and agents |
| LangGraph | `@axonpush/sdk` | `AxonPushLangGraphHandler` with graph node tracing |
| OpenAI Agents SDK | `@axonpush/sdk` | `AxonPushRunHooks` for agent lifecycle |
| Anthropic / Claude | `@axonpush/sdk` | `AxonPushAnthropicTracer` wrapping messages.create() |
| Vercel AI SDK | `@axonpush/sdk` | `axonPushMiddleware` for generateText/streamText |
| Mastra | `@axonpush/sdk` | `AxonPushMastraHooks` for workflows and tools |
| Google ADK | `@axonpush/sdk` | `axonPushADKCallbacks` for agent/model/tool lifecycle |
| LlamaIndex | `@axonpush/sdk` | `AxonPushLlamaIndexHandler` for queries and retrieval |
| Custom | `@axonpush/sdk` | Direct event publishing via `client.events.publish()` |

## Requirements

- Node.js 20+
- Claude Code CLI installed and authenticated
