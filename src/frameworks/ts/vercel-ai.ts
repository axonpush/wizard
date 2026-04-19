import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_VERCEL_AI_CONFIG: FrameworkConfig = {
  name: "Vercel AI SDK",
  language: "typescript",
  integration: Integration.vercelAi,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["ai", "@ai-sdk/openai", "@ai-sdk/anthropic", "@ai-sdk/google"],
    imports: ["from \"ai\"", "from 'ai'", "from \"@ai-sdk/", "from '@ai-sdk/"],
  },
  prompts: {
    integrationHint:
      "Create axonPushMiddleware and pass it as experimental_telemetry middleware to generateText/streamText, or wrap the model with wrapLanguageModel()",
  },
  skillDir: "skills/ts-vercel-ai",
  remoteSkillKey: "Vercel AI",
  commandmentGroup: Integration.vercelAi,
};
