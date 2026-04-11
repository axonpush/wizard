import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_CUSTOM_CONFIG: FrameworkConfig = {
  name: "Custom / Unsupported Framework (TS)",
  language: "typescript",
  integration: Integration.tsCustom,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: [],
    imports: [],
  },
  prompts: {
    integrationHint:
      "Create an AxonPush client and use client.events.publish() to send events from your code",
  },
  skillDir: "skills/ts-custom",
  commandmentGroup: Integration.tsCustom,
};
