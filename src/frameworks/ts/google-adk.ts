import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_GOOGLE_ADK_CONFIG: FrameworkConfig = {
  name: "Google ADK",
  language: "typescript",
  integration: Integration.googleAdk,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["@google/genai", "@google-cloud/vertexai"],
    imports: ["from \"@google/genai", "from '@google/genai"],
  },
  prompts: {
    integrationHint:
      "Create axonPushADKCallbacks and register beforeAgent/afterAgent/beforeModel/afterModel/beforeTool/afterTool callbacks",
  },
  skillDir: "skills/ts-google-adk",
  commandmentGroup: Integration.googleAdk,
};
