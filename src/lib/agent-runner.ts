import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Integration, type Language, type ObservabilityMode } from "./constants.js";
import type { CommandmentGroup, FrameworkConfig } from "./framework-config.js";
import type { PackageManager } from "./detection.js";
import type { LogLibrary } from "./detection.js";
import { getLogIntegrationSnippet } from "./detection.js";
import { runAgent } from "./agent-interface.js";
import { prefetchSkills } from "./skill-fetcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ExistingAppSummary {
  id: number;
  name: string;
  channels: Array<{ id: number; name: string }>;
}

export interface RunnerOptions {
  configs: FrameworkConfig[];
  projectDir: string;
  packageManager: PackageManager;
  language: Language;
  apiKey: string;
  tenantId: string;
  baseUrl: string;
  observabilityMode: ObservabilityMode;
  existingApp?: ExistingAppSummary;
  logLibraries: LogLibrary[];
  skillContent?: Map<Integration, string>;
}

function readSkill(skillDir: string): string {
  const candidates = [
    path.resolve(__dirname, "..", skillDir, "SKILL.md"),
    path.resolve(__dirname, "..", "..", skillDir, "SKILL.md"),
    path.resolve(process.cwd(), skillDir, "SKILL.md"),
  ];
  for (const p of candidates) {
    try { return fs.readFileSync(p, "utf-8"); } catch {}
  }
  return "";
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function buildPyInstallCmd(pm: PackageManager, configs: FrameworkConfig[]): string {
  const extras = dedupe(configs.map((c) => c.installPackage));
  const pkg = extras.length > 0 ? `"axonpush[${extras.join(",")}]"` : `"axonpush"`;
  const cmds: Record<string, string> = {
    uv: `uv add ${pkg}`,
    poetry: `poetry add ${pkg}`,
    pip: `pip install ${pkg}`,
  };
  return cmds[pm] ?? `pip install ${pkg}`;
}

function buildTsInstallCmd(pm: PackageManager, configs: FrameworkConfig[]): string {
  const extraPackages = dedupe(configs.flatMap((c) => c.extraTsPackages ?? []));
  const packages = ["@axonpush/sdk@latest", ...extraPackages].join(" ");
  const cmds: Record<string, string> = {
    bun: `bun add ${packages}`,
    pnpm: `pnpm add ${packages}`,
    yarn: `yarn add ${packages}`,
    npm: `npm install ${packages}`,
  };
  return cmds[pm] ?? `npm install ${packages}`;
}

function buildInstallCmd(language: Language, pm: PackageManager, configs: FrameworkConfig[]): string {
  if (language === "typescript") return buildTsInstallCmd(pm, configs);
  return buildPyInstallCmd(pm, configs);
}

function resolveCommandmentGroups(
  configs: FrameworkConfig[],
  mode: ObservabilityMode,
): CommandmentGroup[] {
  const groups = new Set<CommandmentGroup>(["core"]);
  for (const c of configs) {
    groups.add(c.commandmentGroup ?? c.integration);
  }
  if (mode === "otel" || mode === "both") groups.add(Integration.otel);
  return [...groups];
}

function renderExistingAppSection(app: ExistingAppSummary): string {
  const channels = app.channels.length === 0
    ? "(no channels yet — create any channels this project needs under this app)"
    : app.channels.map((c) => `  - ${c.name} (id=${c.id})`).join("\n");
  return `## Existing AxonPush App (reuse)

You are reusing an existing app. Do NOT create a new app.
- App name: ${app.name}
- App id: ${app.id}

Existing channels under this app:
${channels}

Only create channels that are missing for this project. Reuse existing channel IDs in .env (map each logical area to the matching existing channel where possible). If you create a new channel, use the create-channel helper with appId=${app.id}.`;
}

function renderLoggerSection(language: Language, loggers: LogLibrary[]): string {
  if (loggers.length === 0) return "";
  const lines: string[] = [];
  lines.push("## Detected Logging Libraries");
  lines.push("");
  lines.push("Wire AxonPush into the matching logger(s). Only add what the project actually uses.");
  lines.push("");
  for (const lib of loggers) {
    const snippet = getLogIntegrationSnippet(lib);
    lines.push(`### ${lib}`);
    lines.push("```" + (language === "typescript" ? "typescript" : "python"));
    lines.push(snippet.importStmt);
    lines.push(snippet.setup);
    lines.push("```");
    lines.push(`Notes: ${snippet.notes}`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderModeHeader(mode: ObservabilityMode): string {
  const descriptions: Record<ObservabilityMode, string> = {
    agent: "Install framework callback handlers only. Do not touch OpenTelemetry.",
    otel: "Install the AxonPushSpanExporter and wire detected loggers. Do NOT install any framework callback handlers.",
    both: "Install framework callback handlers AND the AxonPushSpanExporter. Framework callbacks are the primary trace source; OTel supplements with low-level spans. Also wire detected loggers.",
  };
  return `## Observability Mode: ${mode}\n\n${descriptions[mode]}`;
}

function buildPrompt(opts: RunnerOptions): string {
  const pkgCmd = buildInstallCmd(opts.language, opts.packageManager, opts.configs);
  const frameworkNames = opts.configs.length > 0
    ? opts.configs.map((c) => c.name).join(", ")
    : "(none)";

  const frameworkSections = opts.configs
    .map((c) => {
      const remoteSkill = opts.skillContent?.get(c.integration);
      const skill = remoteSkill || readSkill(c.skillDir);
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

  const existingAppSection = opts.existingApp ? renderExistingAppSection(opts.existingApp) + "\n\n" : "";
  const loggerSection = (opts.observabilityMode === "otel" || opts.observabilityMode === "both")
    ? renderLoggerSection(opts.language, opts.logLibraries) + "\n"
    : "";

  const appStep = opts.existingApp
    ? `2. **Reuse the existing AxonPush app** (id=${opts.existingApp.id}, name=${opts.existingApp.name}). Do NOT create a new app.`
    : `2. **Create an AxonPush app** using the helper. Use a descriptive name based on the project.`;

  const channelStep = opts.existingApp
    ? `3. **Diff and create channels.** Start from the existing channels (${opts.existingApp.channels.map((c) => c.name).join(", ") || "none"}). Only create channels that are missing for the logical areas of this codebase. Use descriptive, lowercase, hyphenated names (5-30 chars).`
    : `3. **Create channels** using the helper. Create as many channels as makes sense for the project's structure. Consider:
   - Separate channels per framework (e.g. LangChain vs OpenAI Agents)
   - Separate channels per logical module, service, or agent (e.g. "rag-pipeline", "chat-agent", "data-ingestion")
   - Separate channels for different environments or concerns if applicable

   Use descriptive, lowercase, hyphenated names (5-30 chars). Each channel name must be at least 5 characters.`;

  return `You are integrating the ${sdkName} into this project.

## Project Info
- Directory: ${opts.projectDir}
- Package manager: ${opts.packageManager}
- Language: ${opts.language}
- Frameworks in scope: ${frameworkNames}
- Observability mode: ${opts.observabilityMode}

${renderModeHeader(opts.observabilityMode)}

${existingAppSection}## AxonPush API Helper

A helper script is available at \`.axonpush-api-helper.mjs\` in the project root. Use it via Bash:

\`\`\`bash
node .axonpush-api-helper.mjs list-apps
node .axonpush-api-helper.mjs list-app <appId>
node .axonpush-api-helper.mjs create-app <name>
node .axonpush-api-helper.mjs create-channel <name> <appId>
\`\`\`

All commands return JSON. Channels come nested inside each app in \`list-apps\` and \`list-app\`.

## Steps

1. **Analyze the codebase.** Explore the project structure, entry points, modules, and agent/chain definitions. Understand the different logical areas of the codebase.

${appStep}

${channelStep}

4. **Install the SDK:**
   Run: ${pkgCmd}

5. **Update .env** in the project root with credentials and channel IDs:
   - AXONPUSH_API_KEY=${opts.apiKey}
   - AXONPUSH_TENANT_ID=${opts.tenantId}
   - AXONPUSH_BASE_URL=${opts.baseUrl}
   - Add a channel ID env var for each channel you are using (e.g. AXONPUSH_CHANNEL_ID_RAG=5)

   If .env already exists, append the AXONPUSH_ variables (don't overwrite existing vars).

6. **Integrate the SDK** into each relevant entry point, using the appropriate channel ID env var.
   Never hardcode channel IDs — always read from ${envAccess}.
   Use ${channelIdExpr} to parse the channel ID.${opts.language === "typescript" ? "\n   Make sure process.env values are available (e.g. via dotenv or framework built-in env loading)." : "\n   Make sure os is imported if using os.environ."}

## Frameworks

${frameworkSections || "(No framework callbacks to install in this mode.)"}

IMPORTANT: You MUST integrate AxonPush into ALL frameworks listed above. Do not skip any framework.
Each framework has its own integration class and pattern — follow the skill reference for each one.
If multiple frameworks are detected, create separate handler/hooks instances for each and wire them into the appropriate entry points.

${loggerSection}When done, summarize: what app and channels you used, and what code you changed.`;
}

export async function agentRunner(
  opts: RunnerOptions,
  onStatus: (msg: string) => void,
): Promise<void> {
  if (!opts.skillContent) {
    opts.skillContent = await prefetchSkills(opts.language);
  }
  const prompt = buildPrompt(opts);
  const groups = resolveCommandmentGroups(opts.configs, opts.observabilityMode);
  await runAgent(prompt, opts.projectDir, onStatus, opts.language, groups);
}
