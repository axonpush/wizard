# @axonpush/wizard

AI-powered wizard that integrates the [AxonPush](https://github.com/axonpush/python-sdk) Python SDK into your AI agent project using Claude Code.

## Usage

```bash
npx @axonpush/wizard
```

The wizard will:
1. Detect your project's AI framework (LangChain, OpenAI Agents, Anthropic, CrewAI)
2. Ask for your AxonPush credentials
3. Use Claude Code to install the SDK and add integration code to your project

## Options

```
--integration, -i   Framework (langchain, openai-agents, anthropic, crewai, core)
--api-key           AxonPush API key
--tenant-id         AxonPush tenant/organization ID
--base-url          AxonPush server URL (default: http://localhost:3000)
--install-dir       Project directory (default: current directory)
```

## Non-interactive

```bash
npx @axonpush/wizard \
  --integration langchain \
  --api-key ak_your_key \
  --tenant-id 1
```

## Supported Frameworks

| Framework | Extra | Integration |
|-----------|-------|-------------|
| LangChain / LangGraph | `axonpush[langchain]` | Callback handler for chains and agents |
| OpenAI Agents SDK | `axonpush[openai-agents]` | Run hooks for agent lifecycle |
| Anthropic / Claude | `axonpush[anthropic]` | Tracer wrapping messages.create() |
| CrewAI | `axonpush[crewai]` | Step and task callbacks |
| Core SDK | `axonpush` | Direct event publishing |

## Requirements

- Node.js 20+
- Claude Code CLI installed and authenticated
- A Python project to integrate into
