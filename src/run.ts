import path from "path";
import fs from "fs";
import { Integration, INTEGRATION_LABELS, DEFAULT_BASE_URL, type Language } from "./lib/constants.js";
import { getConfig } from "./lib/registry.js";
import { detectFrameworks, detectPackageManager, detectLanguage } from "./lib/detection.js";
import { agentRunner } from "./lib/agent-runner.js";
import { browserAuth } from "./lib/browser-auth.js";
import {
  showBanner,
  selectOne,
  selectMany,
  textInput,
  showStatus,
  showSuccess,
} from "./lib/tui.js";

function buildApiHelper(opts: { apiKey: string; tenantId: string; baseUrl: string }): string {
  return `const BASE = ${JSON.stringify(opts.baseUrl)};
const HEADERS = {
  "X-API-Key": ${JSON.stringify(opts.apiKey)},
  "x-tenant-id": ${JSON.stringify(opts.tenantId)},
  "Content-Type": "application/json",
};

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) { console.error("ERROR", res.status, text); process.exit(1); }
  try { console.log(JSON.stringify(JSON.parse(text), null, 2)); } catch { console.log(text); }
}

const [,, cmd, ...args] = process.argv;
switch (cmd) {
  case "list-apps":      api("GET",  "/apps"); break;
  case "create-app":     api("POST", "/apps", { name: args[0] }); break;
  case "list-channels":  api("GET",  "/channel?appId=" + args[0]); break;
  case "create-channel": api("POST", "/channel", { name: args[0], appId: Number(args[1]) }); break;
  default: console.error("Unknown command:", cmd); process.exit(1);
}
`;
}

interface WizardArgs {
  integrations?: string[];
  apiKey?: string;
  tenantId?: string;
  baseUrl?: string;
  installDir?: string;
  language?: Language;
}

const PYTHON_FRAMEWORKS: Integration[] = [
  Integration.langchain,
  Integration.openaiAgents,
  Integration.anthropic,
  Integration.crewai,
  Integration.deepAgents,
];

const TS_FRAMEWORKS: Integration[] = [
  Integration.langchain,
  Integration.langgraph,
  Integration.openaiAgents,
  Integration.anthropic,
  Integration.vercelAi,
  Integration.mastra,
  Integration.googleAdk,
  Integration.llamaindex,
];

export async function run(args: WizardArgs): Promise<void> {
  const projectDir = args.installDir || process.cwd();
  const baseUrl = args.baseUrl || DEFAULT_BASE_URL;

  let language: Language;
  if (args.language) {
    language = args.language;
  } else {
    const detected = detectLanguage(projectDir);
    if (detected === "both") {
      showBanner({ projectDir });
      language = await selectOne("Both Python and TypeScript detected. Which SDK?", [
        { label: "TypeScript (@axonpush/sdk)", value: "typescript" as const },
        { label: "Python (axonpush)", value: "python" as const },
      ]);
    } else {
      language = detected;
    }
  }

  const pkgMgr = detectPackageManager(projectDir, language);
  showBanner({ projectDir, language, pkgMgr });

  const supportedFrameworks = language === "typescript" ? TS_FRAMEWORKS : PYTHON_FRAMEWORKS;
  const customIntegration = language === "typescript" ? Integration.tsCustom : Integration.custom;

  let integrations: Integration[] = [];
  if (args.integrations && args.integrations.length > 0) {
    for (const integ of args.integrations) {
      if (integ in Integration) {
        integrations.push(integ as Integration);
      }
    }
  }

  if (integrations.length === 0) {
    const detected = detectFrameworks(projectDir, language);
    const detectedSet = new Set(detected);

    const choices = supportedFrameworks.map((integ) => ({
      label: INTEGRATION_LABELS[integ] + (detectedSet.has(integ) ? " (detected)" : ""),
      value: integ,
      preselected: detectedSet.has(integ),
    }));

    choices.push({
      label: INTEGRATION_LABELS[customIntegration],
      value: customIntegration,
      preselected: false,
    });

    integrations = await selectMany("Select framework(s) to integrate:", choices);

    if (integrations.length === 0) {
      process.exit(1);
    }
  }

  const configs = integrations
    .map((i) => getConfig(language, i))
    .filter((c): c is NonNullable<typeof c> => c != null);

  let apiKey = args.apiKey;
  let tenantId = args.tenantId;

  if (!apiKey) {
    const method = await selectOne("How would you like to authenticate?", [
      { label: "Log in via browser (recommended)", value: "browser" as const },
      { label: "Enter API key manually", value: "manual" as const },
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

  const helperPath = path.join(projectDir, ".axonpush-api-helper.mjs");
  const helperScript = buildApiHelper({ apiKey, tenantId, baseUrl });
  fs.writeFileSync(helperPath, helperScript);

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
