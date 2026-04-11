import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_ANTHROPIC_CONFIG: FrameworkConfig = {
  name: "Anthropic / Claude (TS)",
  language: "typescript",
  integration: Integration.anthropic,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["@anthropic-ai/sdk"],
    imports: ["from \"@anthropic-ai/sdk", "from '@anthropic-ai/sdk"],
  },
  prompts: {
    integrationHint:
      "Create AxonPushAnthropicTracer and use tracer.createMessage(anthropicClient, params) instead of anthropicClient.messages.create(params)",
  },
  skillDir: "skills/ts-anthropic",
  commandmentGroup: Integration.anthropic,
};
