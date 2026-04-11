import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const DEEPAGENTS_CONFIG: FrameworkConfig = {
  name: "LangChain Deep Agents",
  language: "python",
  integration: Integration.deepAgents,
  installPackage: "deepagents",
  detection: {
    packages: ["deepagents"],
    imports: ["from deepagents", "import deepagents", "create_deep_agent"],
  },
  prompts: {
    integrationHint:
      'Add AxonPushDeepAgentHandler to agent.invoke() via config={"callbacks": [handler]}. It auto-traces planning, subagent, filesystem, and sandbox tool calls.',
  },
  skillDir: "skills/deepagents",
  commandmentGroup: Integration.deepAgents,
};
