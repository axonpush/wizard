import path from "path";
import fs from "fs";
import {
  Integration,
  INTEGRATION_LABELS,
  DEFAULT_BASE_URL,
  type Language,
} from "./lib/constants.js";
import { getConfig, getConfigsForLanguage } from "./lib/registry.js";
import {
  detectFrameworks,
  detectPackageManager,
  detectLanguage,
  detectLogLibraries,
} from "./lib/detection.js";
import { agentRunner, type ExistingAppSummary } from "./lib/agent-runner.js";
import { browserAuth } from "./lib/browser-auth.js";
import { buildApiHelperScript } from "./lib/api-helper.js";
import { listApps, type ExistingApp } from "./lib/api-client.js";
import {
  detectOtelInstalled,
  getOtelConfigs,
  promptObservabilityMode,
} from "./lib/observability.js";
import { hasLikelyMatchForProject, selectOrCreateApp } from "./lib/app-selection.js";
import {
  showBanner,
  selectOne,
  selectMany,
  textInput,
  showStatus,
  showSuccess,
} from "./lib/tui.js";

interface WizardArgs {
  integrations?: string[];
  apiKey?: string;
  tenantId?: string;
  baseUrl?: string;
  installDir?: string;
  language?: Language;
}

function toExistingAppSummary(app: ExistingApp): ExistingAppSummary {
  return {
    id: app.id,
    name: app.name,
    channels: app.channels.map((c) => ({ id: c.id, name: c.name })),
  };
}

async function resolveLanguage(projectDir: string, requested: Language | undefined): Promise<Language> {
  if (requested) return requested;
  const detected = detectLanguage(projectDir);
  if (detected !== "both") return detected;
  showBanner({ projectDir });
  return selectOne<Language>("Both Python and TypeScript detected. Which SDK?", [
    { label: "TypeScript (@axonpush/sdk)", value: "typescript" },
    { label: "Python (axonpush)", value: "python" },
  ]);
}

async function resolveIntegrations(
  args: WizardArgs,
  language: Language,
  projectDir: string,
): Promise<Integration[]> {
  if (args.integrations && args.integrations.length > 0) {
    return args.integrations.filter((i): i is Integration =>
      Object.values(Integration).includes(i as Integration),
    ) as Integration[];
  }

  const supported = getConfigsForLanguage(language).map((c) => c.integration);
  const detected = new Set(detectFrameworks(projectDir, language));
  const customIntegration = language === "typescript" ? Integration.tsCustom : Integration.custom;

  const choices = supported
    .filter((i) => i !== customIntegration)
    .map((integ) => ({
      label: INTEGRATION_LABELS[integ] + (detected.has(integ) ? " (detected)" : ""),
      value: integ,
      preselected: detected.has(integ),
    }));

  choices.push({
    label: INTEGRATION_LABELS[customIntegration],
    value: customIntegration,
    preselected: false,
  });

  return selectMany<Integration>("Select framework(s) to integrate:", choices);
}

async function resolveCredentials(
  args: WizardArgs,
): Promise<{ apiKey: string; tenantId: string }> {
  let apiKey = args.apiKey;
  let tenantId = args.tenantId;

  if (!apiKey) {
    const method = await selectOne<"browser" | "manual">("How would you like to authenticate?", [
      { label: "Log in via browser (recommended)", value: "browser" },
      { label: "Enter API key manually", value: "manual" },
    ]);

    if (method === "browser") {
      const status = showStatus("Opening browser for authentication...");
      try {
        const result = await browserAuth();
        apiKey = result.apiKey;
        tenantId = result.tenantId;
        status.done("Authenticated via browser!");
      } catch (err) {
        status.fail(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    } else {
      apiKey = await textInput("AxonPush API Key:", { mask: "*" });
      if (!apiKey) process.exit(0);
    }
  }

  if (!tenantId) {
    tenantId = await textInput("Tenant ID:", { initial: "1" });
    if (!tenantId) process.exit(0);
  }

  return { apiKey, tenantId };
}

async function fetchExistingAppSelection(
  projectDir: string,
  apiKey: string,
  tenantId: string,
  baseUrl: string,
): Promise<ExistingAppSummary | undefined> {
  const status = showStatus("Fetching your existing AxonPush apps...");
  let apps: ExistingApp[] = [];
  try {
    apps = await listApps({ apiKey, tenantId, baseUrl });
  } catch (err) {
    status.fail(`Couldn't fetch apps (${err instanceof Error ? err.message : String(err)}); proceeding as new.`);
    return undefined;
  }

  if (apps.length === 0) {
    status.done("No existing apps found.");
    return undefined;
  }

  if (!hasLikelyMatchForProject(apps, projectDir)) {
    status.done(
      `Found ${apps.length} existing app${apps.length === 1 ? "" : "s"}, none look reusable for this project — creating a new one.`,
    );
    return undefined;
  }

  status.done(`Found ${apps.length} existing app${apps.length === 1 ? "" : "s"}.`);

  const selection = await selectOrCreateApp(apps, projectDir);
  if ("create" in selection) return undefined;
  return toExistingAppSummary(selection.reuse);
}

export async function run(args: WizardArgs): Promise<void> {
  const projectDir = args.installDir || process.cwd();
  const baseUrl = args.baseUrl || DEFAULT_BASE_URL;

  const language = await resolveLanguage(projectDir, args.language);
  const pkgMgr = detectPackageManager(projectDir, language);
  showBanner({ projectDir, language, pkgMgr });

  const otelDetected = detectOtelInstalled(projectDir, language);
  const observabilityMode = await promptObservabilityMode({ otelDetected });

  const integrations: Integration[] = observabilityMode === "otel"
    ? []
    : await resolveIntegrations(args, language, projectDir);

  if (observabilityMode !== "otel" && integrations.length === 0) {
    process.exit(1);
  }

  const frameworkConfigs = integrations
    .map((i) => getConfig(language, i))
    .filter((c): c is NonNullable<typeof c> => c != null);

  const configs = observabilityMode === "agent"
    ? frameworkConfigs
    : [...frameworkConfigs, ...getOtelConfigs(language)];

  const { apiKey, tenantId } = await resolveCredentials(args);

  const existingApp = await fetchExistingAppSelection(projectDir, apiKey, tenantId, baseUrl);
  const logLibraries = detectLogLibraries(projectDir, language);

  const helperPath = path.join(projectDir, ".axonpush-api-helper.mjs");
  fs.writeFileSync(helperPath, buildApiHelperScript({ apiKey, tenantId, baseUrl }));

  const status = showStatus("Running Claude Code agent...");

  try {
    await agentRunner(
      {
        configs,
        projectDir,
        packageManager: pkgMgr,
        language,
        apiKey,
        tenantId,
        baseUrl,
        observabilityMode,
        existingApp,
        logLibraries,
      },
      (msg) => {
        status.update(msg);
      },
    );
    status.done("AxonPush integrated!");

    showSuccess([
      "Next steps:",
      "  1. Run your agent and check the AxonPush dashboard",
      "  2. View traces at https://axonpush.xyz/traces",
    ]);
  } catch (error) {
    status.fail(`Agent failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  } finally {
    try { fs.unlinkSync(helperPath); } catch {}
  }
}
