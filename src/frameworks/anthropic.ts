import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const ANTHROPIC_CONFIG: FrameworkConfig = {
  name: "Anthropic / Claude",
  integration: Integration.anthropic,
  packageExtra: "anthropic",
  detection: {
    packages: ["anthropic"],
    imports: ["import anthropic", "from anthropic"],
  },
  prompts: {
    integrationHint:
      "Wrap anthropic_client.messages.create() with tracer.create_message() or tracer.acreate_message()",
  },
  skillDir: "skills/anthropic",
};
