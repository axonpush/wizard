import { rm } from "fs/promises";
import { join } from "path";

const outdir = join(import.meta.dir, "..", "dist");
await rm(outdir, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["src/bin.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  external: [
    "@anthropic-ai/claude-agent-sdk",
    "ink",
    "react",
    "react/jsx-runtime",
    "ink-select-input",
    "ink-text-input",
    "ink-spinner",
    "yoga-wasm-web",
  ],
  banner: "#!/usr/bin/env node",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}
