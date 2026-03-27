import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
import { Integration, INTEGRATION_LABELS, DEFAULT_BASE_URL } from "./lib/constants.js";
import { FRAMEWORK_REGISTRY } from "./lib/registry.js";
import { detectFrameworks, detectPackageManager } from "./lib/detection.js";
import { agentRunner } from "./lib/agent-runner.js";

interface WizardArgs {
  integration?: string;
  apiKey?: string;
  tenantId?: string;
  baseUrl?: string;
  installDir?: string;
}

export async function run(args: WizardArgs): Promise<void> {
  const projectDir = args.installDir || process.cwd();

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
      console.log(chalk.yellow(`  Multiple frameworks detected: ${detected.map((d) => INTEGRATION_LABELS[d]).join(", ")}\n`));
      const { choice } = await prompts({
        type: "select",
        name: "choice",
        message: "Which framework integration?",
        choices: detected.map((d) => ({ title: INTEGRATION_LABELS[d], value: d })),
      });
      if (!choice) process.exit(0);
      integration = choice;
    } else {
      console.log(chalk.yellow("  No AI framework detected.\n"));
      const { choice } = await prompts({
        type: "select",
        name: "choice",
        message: "Choose an integration",
        choices: Object.entries(INTEGRATION_LABELS).map(([value, title]) => ({ title, value })),
      });
      if (!choice) process.exit(0);
      integration = choice;
    }
  }

  const config = FRAMEWORK_REGISTRY[integration];

  // 2. Gather credentials
  let apiKey = args.apiKey;
  let tenantId = args.tenantId;
  let baseUrl = args.baseUrl || DEFAULT_BASE_URL;

  if (!apiKey) {
    const res = await prompts({ type: "password", name: "value", message: "AxonPush API Key" });
    apiKey = res.value;
    if (!apiKey) process.exit(0);
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

  // 3. Run agent
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

  // 4. Outro
  console.log();
  console.log(chalk.green("  Next steps:"));
  console.log(chalk.dim("    1. Run your agent and check the AxonPush dashboard"));
  console.log(chalk.dim(`    2. View traces at ${baseUrl.replace("3000", "5173")}/traces`));
  console.log();
}
