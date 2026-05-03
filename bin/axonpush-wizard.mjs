#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const has = (cmd) =>
  spawnSync("which", [cmd], { stdio: "ignore" }).status === 0;

const args = process.argv.slice(2);
const localIdx = args.indexOf("--local");
const source =
  localIdx >= 0 && args[localIdx + 1] ? args[localIdx + 1] : "axonpush/skills";

const install = spawnSync("npx", ["-y", "skills", "add", source], { stdio: "inherit" });
if (install.status !== 0) {
  console.error("\nFailed to install axonpush skills via `npx skills add`.");
  console.error("Make sure Node.js 18+ and a network connection are available.");
  process.exit(install.status ?? 1);
}

const agents = [
  ["claude", ["-p", "/axonpush-integrate"]],
  ["cursor", ["chat", "Run the axonpush-integrate skill"]],
  ["codex", ["Run the axonpush-integrate skill"]],
];

for (const [bin, agentArgs] of agents) {
  if (has(bin)) {
    const result = spawnSync(bin, agentArgs, { stdio: "inherit" });
    process.exit(result.status ?? 0);
  }
}

console.log("\naxonpush skills installed.");
console.log("Open your AI coding agent and ask:");
console.log("  > Run the axonpush-integrate skill");
console.log("\nSupported: Claude Code, Cursor, Codex, OpenCode, Cline, GitHub Copilot, Windsurf, Gemini, and 40+ others.");
