const COMMANDMENTS = [
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
  "Use channel_id=1 as placeholder if no channel ID is provided.",
  "When done, briefly summarize what files were changed and what the user should do next.",
];

export function getCommandments(): string {
  return COMMANDMENTS.map((c, i) => `${i + 1}. ${c}`).join("\n");
}
