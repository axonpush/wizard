import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Language } from "./constants.js";
import type { FrameworkConfig } from "./framework-config.js";
import type { PackageManager } from "./detection.js";
import { runAgent } from "./agent-interface.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface RunnerOptions {
  configs: FrameworkConfig[];
  projectDir: string;
  packageManager: PackageManager;
  language: Language;
  apiKey: string;
  tenantId: string;
  baseUrl: string;
}

function readSkill(skillDir: string): string {
  const candidates = [
    path.resolve(__dirname, "..", skillDir, "SKILL.md"),
    path.resolve(process.cwd(), skillDir, "SKILL.md"),
  ];
  for (const p of candidates) {
    try { return fs.readFileSync(p, "utf-8"); } catch {}
  }
  return "";
}

function buildPyInstallCmd(pm: PackageManager, extras: string[]): string {
  const filtered = extras.filter(Boolean);
  const pkg = filtered.length > 0 ? `"axonpush[${filtered.join(",")}]"` : `"axonpush"`;
  const cmds: Record<string, string> = {
    uv: `uv add ${pkg}`,
    poetry: `poetry add ${pkg}`,
    pip: `pip install ${pkg}`,
  };
  return cmds[pm] ?? `pip install ${pkg}`;
}

function buildTsInstallCmd(pm: PackageManager): string {
  const cmds: Record<string, string> = {
    bun: "bun add @axonpush/sdk",
    pnpm: "pnpm add @axonpush/sdk",
    yarn: "yarn add @axonpush/sdk",
    npm: "npm install @axonpush/sdk",
  };
  return cmds[pm] ?? "npm install @axonpush/sdk";
}

function buildInstallCmd(language: Language, pm: PackageManager, extras: string[]): string {
  if (language === "typescript") return buildTsInstallCmd(pm);
  return buildPyInstallCmd(pm, extras);
}

function buildPrompt(opts: RunnerOptions): string {
  const extras = opts.configs.map((c) => c.installPackage);
  const pkgCmd = buildInstallCmd(opts.language, opts.packageManager, extras);
  const frameworkNames = opts.configs.map((c) => c.name).join(", ");

  const frameworkSections = opts.configs
    .map((c) => {
      const skill = readSkill(c.skillDir);
      return `### ${c.name}
- Integration hint: ${c.prompts.integrationHint}
${skill ? `\n#### Skill Reference: ${c.name}\n\n${skill}` : ""}`;
    })
    .join("\n\n");

  const sdkName =
    opts.language === "typescript"
      ? "AxonPush TypeScript SDK (@axonpush/sdk)"
      : "AxonPush Python SDK (axonpush)";

  const envAccess =
    opts.language === "typescript"
      ? "process.env"
      : "os.environ";

  const channelIdExpr =
    opts.language === "typescript"
      ? "Number(process.env.AXONPUSH_CHANNEL_ID)"
      : "int(os.environ['AXONPUSH_CHANNEL_ID'])";

  return `You are integrating the ${sdkName} into this project.

## Project Info
- Directory: ${opts.projectDir}
- Package manager: ${opts.packageManager}
- Language: ${opts.language}
- Frameworks detected: ${frameworkNames}

## AxonPush API Helper

A helper script is available at \`.axonpush-api-helper.mjs\` in the project root. Use it via Bash to create apps and channels:

\`\`\`bash
node .axonpush-api-helper.mjs list-apps
node .axonpush-api-helper.mjs create-app <name>
node .axonpush-api-helper.mjs list-channels <appId>
node .axonpush-api-helper.mjs create-channel <name> <appId>
\`\`\`

All commands return JSON.

## Steps

1. **Analyze the codebase.** Explore the project structure, entry points, modules, and agent/chain definitions. Understand the different logical areas of the codebase.

2. **Create an AxonPush app** using the helper. Use a descriptive name based on the project.

3. **Create channels** using the helper. Create as many channels as makes sense for the project's structure. Consider:
   - Separate channels per framework (e.g. LangChain vs OpenAI Agents)
   - Separate channels per logical module, service, or agent (e.g. "rag-pipeline", "chat-agent", "data-ingestion")
   - Separate channels for different environments or concerns if applicable

   Use descriptive, lowercase, hyphenated names (5-30 chars). Each channel name must be at least 5 characters.

4. **Install the SDK:**
   Run: ${pkgCmd}

5. **Update .env** in the project root with credentials and channel IDs:
   - AXONPUSH_API_KEY=${opts.apiKey}
   - AXONPUSH_TENANT_ID=${opts.tenantId}
   - AXONPUSH_BASE_URL=${opts.baseUrl}
   - Add a channel ID env var for each channel you created (e.g. AXONPUSH_CHANNEL_ID_RAG=5)

   If .env already exists, append the AXONPUSH_ variables (don't overwrite existing vars).

6. **Integrate the SDK** into each relevant entry point, using the appropriate channel ID env var.
   Never hardcode channel IDs — always read from ${envAccess}.
   Use ${channelIdExpr} to parse the channel ID.${opts.language === "typescript" ? "\n   Make sure process.env values are available (e.g. via dotenv or framework built-in env loading)." : "\n   Make sure os is imported if using os.environ."}

## Frameworks

${frameworkSections}

When done, summarize: what app and channels you created, and what code you changed.`;
}

export async function agentRunner(
  opts: RunnerOptions,
  onStatus: (msg: string) => void,
): Promise<void> {
  const prompt = buildPrompt(opts);
  await runAgent(prompt, opts.projectDir, onStatus, opts.language);
}
