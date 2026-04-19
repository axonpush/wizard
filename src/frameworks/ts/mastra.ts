import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_MASTRA_CONFIG: FrameworkConfig = {
  name: "Mastra",
  language: "typescript",
  integration: Integration.mastra,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["@mastra/core", "mastra"],
    imports: ["from \"@mastra/", "from '@mastra/", "from \"mastra", "from 'mastra"],
  },
  prompts: {
    integrationHint:
      "Create AxonPushMastraHooks and register beforeToolUse/afterToolUse/onWorkflowStart/onWorkflowEnd hooks on the Mastra agent",
  },
  skillDir: "skills/ts-mastra",
  remoteSkillKey: "Mastra",
  commandmentGroup: Integration.mastra,
};
