import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { run } from "./run.js";

yargs(hideBin(process.argv))
  .scriptName("axonpush-wizard")
  .usage("$0 [options]")
  .option("integration", {
    alias: "i",
    type: "string",
    describe:
      "Framework integration(s). Can be specified multiple times.\n" +
      "Python: langchain, openai-agents, anthropic, crewai, deepagents, custom\n" +
      "TypeScript: langchain, langgraph, openai-agents, anthropic, vercel-ai, mastra, google-adk, llamaindex, ts-custom",
  })
  .option("language", {
    alias: "l",
    type: "string",
    describe: "Project language (python or typescript). Auto-detected if omitted.",
    choices: ["python", "typescript"],
  })
  .option("api-key", {
    type: "string",
    describe: "AxonPush API key",
  })
  .option("tenant-id", {
    type: "string",
    describe: "AxonPush tenant/organization ID",
  })
  .option("base-url", {
    type: "string",
    describe: "AxonPush API URL (for self-hosted: https://api.your-domain)",
  })
  .option("app-url", {
    type: "string",
    describe: "AxonPush dashboard URL used for browser auth (for self-hosted: https://app.your-domain)",
  })
  .option("install-dir", {
    type: "string",
    describe: "Project directory to integrate into (default: cwd)",
  })
  .option("environment", {
    alias: "e",
    type: "string",
    describe:
      "Environment slug to target (e.g. production, staging, dev). Auto-detected from $NODE_ENV / $APP_ENV / $SENTRY_ENVIRONMENT if omitted.",
  })
  .option("credential-type", {
    type: "string",
    choices: ["ak", "pt"],
    describe:
      "Which credential to mint: 'ak' (server-side API key) or 'pt' (publish-only public token for browser/mobile).",
  })
  .option("sentry", {
    type: "boolean",
    default: false,
    describe: "Generate a Sentry SDK integration (DSN + init snippet).",
  })
  .option("debug", {
    type: "boolean",
    default: false,
    describe: "Enable debug output",
  })
  .command(
    "$0",
    "Integrate AxonPush into your AI agent project",
    () => {},
    async (argv) => {
      const integrations = argv.integration
        ? argv.integration.split(",").map((s: string) => s.trim())
        : undefined;
      await run({
        integrations,
        language: argv.language as "python" | "typescript" | undefined,
        apiKey: argv["api-key"] as string | undefined,
        tenantId: argv["tenant-id"] as string | undefined,
        baseUrl: (argv["base-url"] as string | undefined) ?? process.env.AXONPUSH_BASE_URL,
        appUrl: (argv["app-url"] as string | undefined) ?? process.env.AXONPUSH_APP_URL,
        installDir: argv["install-dir"] as string | undefined,
        environment: argv.environment as string | undefined,
        credentialType: argv["credential-type"] as "ak" | "pt" | undefined,
        sentry: argv.sentry as boolean | undefined,
      });
    },
  )
  .help()
  .parse();
