import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const OTEL_TS_CONFIG: FrameworkConfig = {
  name: "OpenTelemetry (TypeScript)",
  language: "typescript",
  integration: Integration.otel,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: [
      "@opentelemetry/api",
      "@opentelemetry/sdk-trace-base",
      "@opentelemetry/sdk-trace-node",
      "@opentelemetry/sdk-node",
    ],
    imports: ["from \"@opentelemetry/", "from '@opentelemetry/"],
  },
  prompts: {
    integrationHint:
      "Attach AxonPushSpanExporter from '@axonpush/sdk/integrations/otel' to the project's TracerProvider via BatchSpanProcessor. Reuse an existing provider if one is already registered.",
  },
  skillDir: "skills/otel-ts",
  remoteSkillKey: "OpenTelemetry",
  internal: true,
  extraTsPackages: ["@opentelemetry/api", "@opentelemetry/sdk-trace-base", "@opentelemetry/sdk-trace-node"],
  commandmentGroup: Integration.otel,
};
