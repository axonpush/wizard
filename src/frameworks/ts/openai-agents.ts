import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_OPENAI_AGENTS_CONFIG: FrameworkConfig = {
  name: "OpenAI Agents SDK (TS)",
  language: "typescript",
  integration: Integration.openaiAgents,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["@openai/agents", "openai-agents"],
    imports: ["from \"@openai/agents", "from '@openai/agents"],
  },
  prompts: {
    integrationHint:
      "Create AxonPushRunHooks and pass as the hooks parameter to Runner.run(agent, input, { hooks })",
  },
  skillDir: "skills/ts-openai-agents",
  commandmentGroup: Integration.openaiAgents,
};
