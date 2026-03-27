import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const OPENAI_AGENTS_CONFIG: FrameworkConfig = {
  name: "OpenAI Agents SDK",
  integration: Integration.openaiAgents,
  packageExtra: "openai-agents",
  detection: {
    packages: ["openai-agents", "agents"],
    imports: ["from agents import", "from agents.", "import agents"],
  },
  prompts: {
    integrationHint:
      "Add AxonPushRunHooks as the hooks parameter to Runner.run(agent, input, hooks=hooks)",
  },
  skillDir: "skills/openai-agents",
};
