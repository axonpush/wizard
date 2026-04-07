import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const CUSTOM_CONFIG: FrameworkConfig = {
  name: "Custom / Unsupported Framework",
  language: "python",
  integration: Integration.custom,
  installPackage: "",
  detection: {
    packages: [],
    imports: [],
  },
  prompts: {
    integrationHint:
      "Create an AxonPush client and use client.events.publish() to send events from your code",
  },
  skillDir: "skills/custom",
};
