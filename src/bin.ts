import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { run } from "./run.js";

yargs(hideBin(process.argv))
  .scriptName("axonpush-wizard")
  .usage("$0 [options]")
  .option("integration", {
    alias: "i",
    type: "string",
    describe: "Framework integration(s) (langchain, openai-agents, anthropic, crewai, deepagents, custom). Can be specified multiple times.",
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
    describe: "AxonPush server URL",
  })
  .option("install-dir", {
    type: "string",
    describe: "Project directory to integrate into (default: cwd)",
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
        apiKey: argv["api-key"] as string | undefined,
        tenantId: argv["tenant-id"] as string | undefined,
        baseUrl: argv["base-url"] as string | undefined,
        installDir: argv["install-dir"] as string | undefined,
      });
    },
  )
  .help()
  .parse();
