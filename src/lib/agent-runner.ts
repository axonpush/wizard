import fs from "fs";
import path from "path";
import type { FrameworkConfig } from "./framework-config.js";
import type { PackageManager } from "./detection.js";
import { runAgent } from "./agent-interface.js";

export interface RunnerOptions {
  config: FrameworkConfig;
  projectDir: string;
  packageManager: PackageManager;
  apiKey: string;
  tenantId: string;
  baseUrl: string;
}

function buildPrompt(opts: RunnerOptions): string {
  const skillPath = path.resolve(__dirname, "..", "..", opts.config.skillDir, "SKILL.md");
  let skillContent = "";
  try {
    skillContent = fs.readFileSync(skillPath, "utf-8");
  } catch {
    // skill file may not be bundled at __dirname in dev, try from cwd
    const altPath = path.resolve(process.cwd(), opts.config.skillDir, "SKILL.md");
    try { skillContent = fs.readFileSync(altPath, "utf-8"); } catch { /* no skill */ }
  }

  const pkgCmd = opts.packageManager === "uv"
    ? `uv add "axonpush${opts.config.packageExtra ? `[${opts.config.packageExtra}]` : ""}"`
    : opts.packageManager === "poetry"
      ? `poetry add "axonpush${opts.config.packageExtra ? `[${opts.config.packageExtra}]` : ""}"`
      : `pip install "axonpush${opts.config.packageExtra ? `[${opts.config.packageExtra}]` : ""}"`;

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
