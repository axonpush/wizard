import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const CORE_CONFIG: FrameworkConfig = {
  name: "Core SDK (no framework)",
  integration: Integration.core,
  packageExtra: "",
  detection: {
    packages: [],
    imports: [],
  },
  prompts: {
    integrationHint:
      "Create an AxonPush client and use client.events.publish() to send events from your code",
  },
  skillDir: "skills/core",
};
