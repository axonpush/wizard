import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const OTEL_PYTHON_CONFIG: FrameworkConfig = {
  name: "OpenTelemetry (Python)",
  language: "python",
  integration: Integration.otel,
  installPackage: "otel",
  detection: {
    packages: ["opentelemetry-sdk", "opentelemetry-api", "opentelemetry-exporter-otlp"],
    imports: ["from opentelemetry", "import opentelemetry"],
  },
  prompts: {
    integrationHint:
      "Attach AxonPushSpanExporter from axonpush.integrations.otel to the project's TracerProvider via BatchSpanProcessor. Reuse an existing provider if one is already registered.",
  },
  skillDir: "skills/otel-python",
  internal: true,
  commandmentGroup: Integration.otel,
};
