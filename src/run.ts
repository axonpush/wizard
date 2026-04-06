import path from "path";
import fs from "fs";
import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
import { Integration, INTEGRATION_LABELS, DEFAULT_BASE_URL } from "./lib/constants.js";
import { FRAMEWORK_REGISTRY } from "./lib/registry.js";
import { detectFrameworks, detectPackageManager } from "./lib/detection.js";
import { agentRunner } from "./lib/agent-runner.js";
import { browserAuth } from "./lib/browser-auth.js";

function buildApiHelper(opts: { apiKey: string; tenantId: string; baseUrl: string }): string {
  return `// Temporary helper — created by AxonPush Wizard, deleted after agent run.
// Usage:
//   node .axonpush-api-helper.mjs list-apps
//   node .axonpush-api-helper.mjs create-app <name>
//   node .axonpush-api-helper.mjs list-channels <appId>
//   node .axonpush-api-helper.mjs create-channel <name> <appId>

const BASE = ${JSON.stringify(opts.baseUrl)};
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
}

const SUPPORTED_FRAMEWORKS: Integration[] = [
  Integration.langchain,
  Integration.openaiAgents,
  Integration.anthropic,
  Integration.crewai,
  Integration.deepAgents,
];

export async function run(args: WizardArgs): Promise<void> {
  const projectDir = args.installDir || process.cwd();

  console.log();
  console.log(chalk.bold("  AxonPush Wizard"));
  console.log(chalk.dim("  AI-powered SDK integration\n"));

  const pkgMgr = detectPackageManager(projectDir);
  console.log(chalk.dim(`  Project: ${projectDir}`));
  console.log(chalk.dim(`  Package manager: ${pkgMgr}\n`));

  // 1. Detect frameworks
  let integrations: Integration[] = [];
  if (args.integrations && args.integrations.length > 0) {
    for (const integ of args.integrations) {
      if (integ in Integration) {
        integrations.push(integ as Integration);
      } else {
        console.log(chalk.yellow(`  Unknown integration: ${integ}`));
      }
    }
    if (integrations.length > 0) {
      console.log(chalk.green(`  Frameworks (from flag): ${integrations.map((i) => INTEGRATION_LABELS[i]).join(", ")}\n`));
    }
  }

  // 2. If no integrations specified via flag, prompt for selection
  if (integrations.length === 0) {
    const detected = detectFrameworks(projectDir);
    const detectedSet = new Set(detected);

    const choices = SUPPORTED_FRAMEWORKS.map((integ) => ({
      title: INTEGRATION_LABELS[integ] + (detectedSet.has(integ) ? " (detected)" : ""),
      value: integ,
      selected: detectedSet.has(integ),
    }));

    choices.push({
      title: "Custom / Unsupported Framework",
      value: Integration.custom,
      selected: false,
    });

    const { frameworks } = await prompts({
      type: "multiselect",
      name: "frameworks",
      message: "Select framework(s) to integrate:",
      choices,
      hint: "Space to select, Enter to confirm",
    });

    if (!frameworks || frameworks.length === 0) {
      console.log(chalk.red("  At least one framework must be selected"));
      process.exit(1);
    }

    integrations = frameworks as Integration[];

    if (detected.length > 0) {
      console.log(chalk.green(`  Detected: ${detected.map((d) => INTEGRATION_LABELS[d]).join(", ")}`));
    }
    console.log(chalk.green(`  Selected: ${integrations.map((i) => INTEGRATION_LABELS[i]).join(", ")}\n`));
  }

  const configs = integrations.map((i) => FRAMEWORK_REGISTRY[i]);

  // 2. Gather credentials
  let apiKey = args.apiKey;
  let tenantId = args.tenantId;
  let baseUrl = args.baseUrl || DEFAULT_BASE_URL;

  if (!apiKey) {
    const { method } = await prompts({
      type: "select",
      name: "method",
      message: "How would you like to authenticate?",
      choices: [
        { title: "Log in via browser (recommended)", value: "browser" },
        { title: "Enter API key manually", value: "manual" },
      ],
    });
    if (!method) process.exit(0);

    if (method === "browser") {
      console.log(chalk.dim("\n  Opening browser...\n"));
      try {
        const result = await browserAuth();
        apiKey = result.apiKey;
        tenantId = result.tenantId;
        console.log(chalk.green("  Authenticated via browser!\n"));
      } catch (err) {
        console.log(chalk.red(`  ${err instanceof Error ? err.message : err}`));
        process.exit(1);
      }
    } else {
      const res = await prompts({ type: "password", name: "value", message: "AxonPush API Key" });
      apiKey = res.value;
      if (!apiKey) process.exit(0);
    }
  }

  if (!tenantId) {
    const res = await prompts({ type: "text", name: "value", message: "Tenant ID", initial: "1" });
    tenantId = res.value;
    if (!tenantId) process.exit(0);
  }

  if (!args.baseUrl) {
    const res = await prompts({ type: "text", name: "value", message: "Base URL", initial: DEFAULT_BASE_URL });
    baseUrl = res.value || DEFAULT_BASE_URL;
  }

  // 3. Write API helper script for the agent to use
  const helperPath = path.join(projectDir, ".axonpush-api-helper.mjs");
  const helperScript = buildApiHelper({ apiKey, tenantId, baseUrl });
  fs.writeFileSync(helperPath, helperScript);

  // 4. Run agent — it will analyze the codebase, create apps/channels, and integrate
  console.log();
  const spinner = ora("Running Claude Code agent...").start();

  try {
    await agentRunner(
      {
        configs,
        projectDir,
        packageManager: detectPackageManager(projectDir),
        apiKey,
        tenantId,
        baseUrl,
      },
      (msg) => {
        spinner.text = msg;
      },
    );
    spinner.succeed("AxonPush integrated!");
  } catch (error) {
    spinner.fail("Agent failed");
    console.error(chalk.red(`\n  ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    // Clean up helper script
    try { fs.unlinkSync(helperPath); } catch {}
  }

  // 5. Outro
  console.log();
  console.log(chalk.green("  Next steps:"));
  console.log(chalk.dim("    1. Run your agent and check the AxonPush dashboard"));
  console.log(chalk.dim("    2. View traces at https://axonpush.xyz/traces"));
  console.log();
}
