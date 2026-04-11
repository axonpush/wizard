import {
  OBSERVABILITY_MODE_LABELS,
  type Language,
  type ObservabilityMode,
} from "./constants.js";
import type { FrameworkConfig } from "./framework-config.js";
import { readPyDependencies, readTsDependencies } from "./detection.js";
import { getConfig } from "./registry.js";
import { Integration } from "./constants.js";
import { selectOne } from "./tui.js";

export interface ObservabilityPromptOptions {
  otelDetected: boolean;
}

export async function promptObservabilityMode(
  opts: ObservabilityPromptOptions,
): Promise<ObservabilityMode> {
  const defaultMode: ObservabilityMode = opts.otelDetected ? "both" : "agent";
  const choices: Array<{ label: string; value: ObservabilityMode }> = [
    {
      label:
        OBSERVABILITY_MODE_LABELS.agent +
        (defaultMode === "agent" ? " (default)" : ""),
      value: "agent",
    },
    {
      label:
        OBSERVABILITY_MODE_LABELS.otel +
        (opts.otelDetected ? " — OTel detected in project" : ""),
      value: "otel",
    },
    {
      label:
        OBSERVABILITY_MODE_LABELS.both +
        (defaultMode === "both" ? " (recommended)" : ""),
      value: "both",
    },
  ];
  return selectOne<ObservabilityMode>("What do you want to integrate with AxonPush?", choices);
}

export function detectOtelInstalled(dir: string, language: Language): boolean {
  if (language === "typescript") {
    const deps = readTsDependencies(dir);
    for (const name of deps) {
      if (name.startsWith("@opentelemetry/")) return true;
    }
    return false;
  }
  const deps = readPyDependencies(dir);
  for (const name of deps) {
    if (name.startsWith("opentelemetry-") || name === "opentelemetry") return true;
  }
  return false;
}

export function getOtelConfigs(language: Language): FrameworkConfig[] {
  const cfg = getConfig(language, Integration.otel);
  return cfg ? [cfg] : [];
}
