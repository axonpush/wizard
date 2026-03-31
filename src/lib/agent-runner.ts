import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { FrameworkConfig } from "./framework-config.js";
import type { PackageManager } from "./detection.js";
import { runAgent } from "./agent-interface.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface RunnerOptions {
  config: FrameworkConfig;
  projectDir: string;
  packageManager: PackageManager;
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

function buildInstallCmd(pm: PackageManager, extra: string): string {
  const pkg = extra ? `"axonpush[${extra}]"` : `"axonpush"`;
  const cmds: Record<PackageManager, string> = {
    uv: `uv add ${pkg}`,
    poetry: `poetry add ${pkg}`,
    pip: `pip install ${pkg}`,
  };
  return cmds[pm];
}

function buildPrompt(opts: RunnerOptions): string {
  const skillContent = readSkill(opts.config.skillDir);
  const pkgCmd = buildInstallCmd(opts.packageManager, opts.config.packageExtra);

  return `You are integrating the AxonPush Python SDK into this project.

## Project Info
- Directory: ${opts.projectDir}
- Package manager: ${opts.packageManager}
- Framework: ${opts.config.name}
- Integration hint: ${opts.config.prompts.integrationHint}

## Credentials (use these in .env)
- AXONPUSH_API_KEY=${opts.apiKey}
- AXONPUSH_TENANT_ID=${opts.tenantId}
- AXONPUSH_BASE_URL=${opts.baseUrl}

## Steps

1. Install the SDK:
   Run: ${pkgCmd}

2. Create or update .env in the project root with the credentials above.
   If .env already exists, append the AXONPUSH_ variables (don't overwrite existing vars).

3. Find the main agent/chain entry point in the project. Look for:
   - Files importing ${opts.config.detection.imports[0] || "the AI framework"}
   - Files with main() or if __name__ == "__main__"
   - app.py, main.py, agent.py, or similar

4. Add AxonPush integration code following the reference below.

5. Make sure os is imported if using os.environ.

${skillContent ? `## Skill Reference\n\n${skillContent}` : ""}

When done, summarize what you changed.`;
}

export async function agentRunner(
  opts: RunnerOptions,
  onStatus: (msg: string) => void,
): Promise<void> {
  const prompt = buildPrompt(opts);
  await runAgent(prompt, opts.projectDir, onStatus);
}
