import type { Language } from "./constants.js";

const PYTHON_COMMANDMENTS = [
  "Never hardcode API keys or secrets in source files. Always use environment variables loaded from .env.",
  "Use the set_env_values wizard tool to create/update .env files. Never use the Write tool for .env.",
  "Use the detect_package_manager wizard tool before installing packages.",
  "Always read a file before modifying it. Never guess file contents.",
  "Add axonpush imports at the top of the file alongside other imports.",
  "Do not remove or modify existing functionality. Only add AxonPush integration code.",
  "If unsure which file to modify, use Glob and Grep to find the main agent/chain entry point.",
  "For LangChain: add handler via config={'callbacks': [handler]} in chain.invoke() or agent_executor.invoke().",
  "For OpenAI Agents: pass hooks=hooks to Runner.run().",
  "For Anthropic: wrap messages.create() with tracer.create_message() or tracer.acreate_message().",
  "For CrewAI: add step_callback=callbacks.on_step and task_callback=callbacks.on_task_complete to Crew().",
  "Always import os at the top if using os.environ for credentials.",
  "Create the AxonPush client as a module-level singleton, not inside each function call.",
  "Use int(os.environ['AXONPUSH_CHANNEL_ID']) for channel_id. Never hardcode channel IDs.",
  "Follow DRY principles: if multiple files need the same AxonPush client setup, create a shared helper module and import from it.",
  "When done, briefly summarize what files were changed and what the user should do next.",
];

const TS_COMMANDMENTS = [
  "Never hardcode API keys or secrets in source files. Always use environment variables from process.env.",
  "Always read a file before modifying it. Never guess file contents.",
  "Add @axonpush/sdk imports at the top of the file alongside other imports.",
  "Do not remove or modify existing functionality. Only add AxonPush integration code.",
  "If unsure which file to modify, use Glob and Grep to find the main agent/chain entry point.",
  "Import the client from '@axonpush/sdk' and integrations from '@axonpush/sdk/integrations/<name>'.",
  "For LangChain: add handler via { callbacks: [handler] } in chain.invoke() or agentExecutor.invoke().",
  "For LangGraph: use AxonPushLangGraphHandler instead of the base LangChain handler.",
  "For OpenAI Agents: pass hooks to Runner.run(agent, input, { hooks }).",
  "For Anthropic: use tracer.createMessage(anthropicClient, params) instead of anthropicClient.messages.create(params).",
  "For Vercel AI: wrap the model with wrapLanguageModel({ model, middleware: axonPushMiddleware(config) }).",
  "For Mastra: call hooks.beforeToolUse/afterToolUse/onWorkflowStart/onWorkflowEnd at lifecycle points.",
  "For Google ADK: register axonPushADKCallbacks at agent/model/tool lifecycle points.",
  "For LlamaIndex: call handler.onQueryStart/onLLMStart/onLLMEnd/onRetrieverStart/onRetrieverEnd at lifecycle points.",
  "Create the AxonPush client as a module-level singleton, not inside each function call.",
  "Use Number(process.env.AXONPUSH_CHANNEL_ID) for channelId. Never hardcode channel IDs.",
  "Follow DRY principles: if multiple files need the same AxonPush client or integration setup, create a shared module (e.g. lib/axonpush.ts) that exports the configured client and handlers, then import from it.",
  "When done, briefly summarize what files were changed and what the user should do next.",
];

export function getCommandments(language: Language = "python"): string {
  const list = language === "typescript" ? TS_COMMANDMENTS : PYTHON_COMMANDMENTS;
  return list.map((c, i) => `${i + 1}. ${c}`).join("\n");
}
