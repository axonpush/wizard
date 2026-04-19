import { Integration, type Language } from "./constants.js";
import type { CommandmentGroup } from "./framework-config.js";

const CORE_PYTHON: string[] = [
  "Never hardcode API keys or secrets in source files. Always use environment variables loaded from .env.",
  "Use the set_env_values wizard tool to create/update .env files. Never use the Write tool for .env.",
  "Use the detect_package_manager wizard tool before installing packages.",
  "Always read a file before modifying it. Never guess file contents.",
  "Add axonpush imports at the top of the file alongside other imports.",
  "Do not remove or modify existing functionality. Only add AxonPush integration code.",
  "If unsure which file to modify, use Glob and Grep to find the main agent/chain entry point.",
  "Always import os at the top if using os.environ for credentials.",
  "Create the AxonPush client as a module-level singleton, not inside each function call.",
  "Use int(os.environ['AXONPUSH_CHANNEL_ID']) for channel_id. Never hardcode channel IDs.",
  "Follow DRY principles: if multiple files need the same AxonPush client setup, create a shared helper module and import from it.",
  "Add type hints to all functions and variables you create or modify.",
  "For async frameworks (OpenAI Agents SDK, async LangChain), use AsyncAxonPush with `async with AsyncAxonPush(...) as client:` context manager pattern.",
  "Centralize AxonPush configuration in a dedicated module (e.g., axonpush_config.py). Export the configured client and handlers. Other modules import from this single source.",
  "If the project uses pydantic or pydantic-settings, define an AxonPushSettings(BaseSettings) class for credentials. Otherwise use a @dataclass with field(default_factory=lambda: os.environ[...]) to centralize env access.",
  "Never scatter bare os.environ['AXONPUSH_...'] lookups across multiple files. All env var access goes through the config module.",
  "When done, briefly summarize what files were changed and what the user should do next.",
];

const CORE_TS: string[] = [
  "Never hardcode API keys or secrets in source files. Always use environment variables from process.env.",
  "Always read a file before modifying it. Never guess file contents.",
  "Add @axonpush/sdk imports at the top of the file alongside other imports.",
  "Do not remove or modify existing functionality. Only add AxonPush integration code.",
  "If unsure which file to modify, use Glob and Grep to find the main agent/chain entry point.",
  "Import the client from '@axonpush/sdk' and integrations from '@axonpush/sdk/integrations/<name>'.",
  "Create the AxonPush client as a module-level singleton, not inside each function call.",
  "Use Number(process.env.AXONPUSH_CHANNEL_ID) for channelId. Never hardcode channel IDs.",
  "Follow DRY principles: if multiple files need the same AxonPush client or integration setup, create a shared module (e.g. lib/axonpush.ts) that exports the configured client and handlers, then import from it.",
  "When done, briefly summarize what files were changed and what the user should do next.",
];

const OTEL_PYTHON: string[] = [
  "Install the OTel extra: axonpush[otel]. Do not attempt to use the exporter without it.",
  "Import from axonpush.integrations.otel: AxonPushSpanExporter.",
  "Prefer BatchSpanProcessor over SimpleSpanProcessor in production.",
  "If a TracerProvider already exists in the project, attach AxonPushSpanExporter to that provider. Never register a second global provider.",
  "Set the 'service.name' resource attribute from the project name when creating a new provider.",
  "For agent projects running in 'both' mode: framework callbacks remain the primary trace source; OTel supplements with low-level spans. Do not double-emit the same span.",
  "For backend services: detect the logging library in use (stdlib logging, loguru, structlog) and wire up the matching axonpush integration (AxonPushLoggingHandler, create_axonpush_loguru_sink, or axonpush_structlog_processor). loguru and structlog require their respective extras.",
];

const OTEL_TS: string[] = [
  "Install the OTel peer deps alongside @axonpush/sdk: @opentelemetry/api and @opentelemetry/sdk-trace-base (plus @opentelemetry/sdk-trace-node if using NodeTracerProvider).",
  "Import AxonPushSpanExporter from '@axonpush/sdk/integrations/otel'.",
  "Prefer BatchSpanProcessor over SimpleSpanProcessor in production.",
  "If a TracerProvider already exists in the project, attach AxonPushSpanExporter to that provider. Never register a second global provider.",
  "Set the 'service.name' resource attribute from the project name when creating a new provider.",
  "For agent projects running in 'both' mode: framework callbacks remain the primary trace source; OTel supplements with low-level spans. Do not double-emit the same span.",
  "For backend services: detect the logging library in use (Pino, Winston, plain console) and wire up the matching integration — createAxonPushPinoStream, createAxonPushWinstonTransport, or setupConsoleCapture as a fallback.",
];

const PYTHON_COMMANDMENTS: Partial<Record<CommandmentGroup, string[]>> = {
  core: CORE_PYTHON,
  [Integration.otel]: OTEL_PYTHON,
  [Integration.langchain]: [
    "For LangChain: add handler via config={'callbacks': [handler]} in chain.invoke() or agent_executor.invoke().",
  ],
  [Integration.openaiAgents]: [
    "For OpenAI Agents: use AsyncAxonPush (not sync AxonPush) — the Agents SDK is async-only.",
    "For OpenAI Agents: pass hooks=axonpush_hooks to Runner.run(agent, input, hooks=axonpush_hooks).",
  ],
  [Integration.anthropic]: [
    "For Anthropic: wrap messages.create() with tracer.create_message() or tracer.acreate_message().",
  ],
  [Integration.crewai]: [
    "For CrewAI: add step_callback=callbacks.on_step and task_callback=callbacks.on_task_complete to Crew().",
    "For CrewAI: call callbacks.on_crew_start() before crew.kickoff() and callbacks.on_crew_end(result) after.",
  ],
  [Integration.deepAgents]: [
    "For Deep Agents: use AxonPushDeepAgentHandler from axonpush.integrations.deepagents — NOT the base LangChain handler. Pass via config={'callbacks': [handler]} to agent.invoke(). It auto-traces planning, subagent spawns, filesystem ops, and sandbox execution.",
  ],
  [Integration.custom]: [
    "For custom/unsupported Python frameworks: use client.events.publish() to send events at key points (start, end, error). Use EventType enum for event categorization.",
  ],
};

const TS_COMMANDMENTS: Partial<Record<CommandmentGroup, string[]>> = {
  core: CORE_TS,
  [Integration.otel]: OTEL_TS,
  [Integration.langchain]: [
    "For LangChain: add handler via { callbacks: [handler] } in chain.invoke() or agentExecutor.invoke().",
  ],
  [Integration.langgraph]: [
    "For LangGraph: use AxonPushLangGraphHandler instead of the base LangChain handler.",
  ],
  [Integration.openaiAgents]: [
    "For OpenAI Agents: pass hooks to Runner.run(agent, input, { hooks }).",
  ],
  [Integration.anthropic]: [
    "For Anthropic: use tracer.createMessage(anthropicClient, params) instead of anthropicClient.messages.create(params).",
  ],
  [Integration.vercelAi]: [
    "For Vercel AI: wrap the model with wrapLanguageModel({ model, middleware: axonPushMiddleware(config) }).",
  ],
  [Integration.mastra]: [
    "For Mastra: call hooks.beforeToolUse/afterToolUse/onWorkflowStart/onWorkflowEnd at lifecycle points.",
  ],
  [Integration.googleAdk]: [
    "For Google ADK: register axonPushADKCallbacks at agent/model/tool lifecycle points.",
  ],
  [Integration.llamaindex]: [
    "For LlamaIndex: call handler.onQueryStart/onLLMStart/onLLMEnd/onRetrieverStart/onRetrieverEnd at lifecycle points.",
  ],
  [Integration.tsCustom]: [
    "For custom/unsupported TS frameworks: use client.events.publish() to send events at key points. Use eventType 'custom' or specific event type strings.",
  ],
};

function commandmentsForLanguage(language: Language): Partial<Record<CommandmentGroup, string[]>> {
  return language === "typescript" ? TS_COMMANDMENTS : PYTHON_COMMANDMENTS;
}

export function getCommandments(
  language: Language = "python",
  groups: CommandmentGroup[] = ["core"],
): string {
  const source = commandmentsForLanguage(language);
  const seen = new Set<CommandmentGroup>();
  const ordered: CommandmentGroup[] = ["core", ...groups.filter((g) => g !== "core")];
  const out: string[] = [];
  for (const group of ordered) {
    if (seen.has(group)) continue;
    seen.add(group);
    const rules = source[group];
    if (!rules) continue;
    for (const rule of rules) out.push(rule);
  }
  return out.map((rule, i) => `${i + 1}. ${rule}`).join("\n");
}
