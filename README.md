# @axonpush/wizard

Launcher for the [AxonPush](https://axonpush.xyz) integration skills. Installs the [`axonpush/skills`](https://github.com/axonpush/skills) bundle into your AI coding agent (Claude Code, Cursor, Codex, OpenCode, Cline, GitHub Copilot, Windsurf, Gemini, and 40+ others) and runs the `axonpush-integrate` orchestrator against your project.

```bash
npx @axonpush/wizard
```

That single command:

1. Installs `axonpush/skills` via [`npx skills add`](https://skills.sh) — auto-detects which agent you have and writes to the right per-agent dir (`.claude/skills/`, `.cursor/skills/`, `.agents/skills/`).
2. Invokes the first supported agent on your `PATH` and asks it to run the `axonpush-integrate` skill.
3. The skill then walks you through: detect language + framework → browser-login (or paste creds) → pick or create app + channel → write `.env` → wire the SDK into your code via the matching framework sub-skill (LangChain, CrewAI, Anthropic, OpenAI Agents, Vercel AI, Mastra, LangGraph, LlamaIndex, Google ADK, OTel, or custom).

## Local development

```bash
npx @axonpush/wizard --local /path/to/local/skills/checkout
```

## Why this is just a launcher

Earlier versions of this CLI bundled an Ink TUI and embedded the integration logic. Since the actual work is done by your AI coding agent following the skills, the wizard is now a tiny shim that installs the skills and starts the agent — keeping `npx @axonpush/wizard` working for everyone who has it bookmarked, while moving the maintainable surface to [`axonpush/skills`](https://github.com/axonpush/skills).

## License

MIT
