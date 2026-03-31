import path from "path";
import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
import { Integration, INTEGRATION_LABELS, DEFAULT_BASE_URL } from "./lib/constants.js";
import { FRAMEWORK_REGISTRY } from "./lib/registry.js";
import { detectFrameworks, detectPackageManager } from "./lib/detection.js";
import { agentRunner } from "./lib/agent-runner.js";
import { browserAuth } from "./lib/browser-auth.js";
import { getOrCreateApp, createChannel } from "./lib/axonpush-api.js";

interface WizardArgs {
  integration?: string;
  apiKey?: string;
  tenantId?: string;
  baseUrl?: string;
  installDir?: string;
}

export async function run(args: WizardArgs): Promise<void> {
  const projectDir = args.installDir || process.cwd();
  const projectName = path.basename(projectDir);

  console.log();
  console.log(chalk.bold("  AxonPush Wizard"));
  console.log(chalk.dim("  AI-powered SDK integration\n"));

  // 1. Detect framework
  let integration: Integration;
  if (args.integration && args.integration in Integration) {
    integration = args.integration as Integration;
    console.log(chalk.green(`  Framework: ${INTEGRATION_LABELS[integration]} (from flag)`));
  } else {
    const detected = detectFrameworks(projectDir);
    const pkgMgr = detectPackageManager(projectDir);
    console.log(chalk.dim(`  Project: ${projectDir}`));
    console.log(chalk.dim(`  Package manager: ${pkgMgr}`));

    if (detected.length === 1) {
      integration = detected[0];
      console.log(chalk.green(`  Detected: ${INTEGRATION_LABELS[integration]}\n`));
    } else if (detected.length > 1) {
      integration = Integration.core;
      console.log(chalk.yellow(`  Multiple frameworks detected: ${detected.map((d) => INTEGRATION_LABELS[d]).join(", ")}`));
      console.log(chalk.dim(`  Using bare SDK integration\n`));
    } else {
      integration = Integration.core;
      console.log(chalk.yellow("  No supported framework detected"));
      console.log(chalk.dim(`  Using bare SDK integration\n`));
    }
  }

  const config = FRAMEWORK_REGISTRY[integration];

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

  // 3. Provision app and channel
  const apiOpts = { apiKey, tenantId, baseUrl };
  const provisionSpinner = ora("Configuring AxonPush app and channel...").start();

  let appId: number;
  let channelId: number;
  try {
    const appName = projectName.length >= 5 ? projectName : `${projectName}-app`;
    const channelName = integration.length >= 5 ? integration : `${integration}-events`;
    const app = await getOrCreateApp(apiOpts, appName);
    const channel = await createChannel(apiOpts, channelName, app.id);
    appId = app.id;
    channelId = channel.id;
    provisionSpinner.succeed(`App "${app.name}" → channel "${channel.name}" (id: ${channel.id})`);
  } catch (error) {
    provisionSpinner.fail("Failed to configure app/channel");
    console.error(chalk.red(`\n  ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }

  // 4. Run agent
  console.log();
  const spinner = ora("Running Claude Code agent...").start();

  try {
    await agentRunner(
      {
        config,
        projectDir,
        packageManager: detectPackageManager(projectDir),
        apiKey,
        tenantId,
        baseUrl,
        appId,
        channelId,
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
  }

  // 5. Outro
  console.log();
  console.log(chalk.green("  Next steps:"));
  console.log(chalk.dim("    1. Run your agent and check the AxonPush dashboard"));
  console.log(chalk.dim("    2. View traces at https://axonpush.xyz/traces"));
  console.log();
}
