import fs from "fs";
import path from "path";
import { load as loadToml } from "js-toml";
import { Integration } from "./constants.js";
import { FRAMEWORK_REGISTRY } from "./registry.js";

export type PackageManager = "uv" | "poetry" | "pip";

export function detectPackageManager(dir: string): PackageManager {
  if (fs.existsSync(path.join(dir, "uv.lock"))) return "uv";
  if (fs.existsSync(path.join(dir, "poetry.lock"))) return "poetry";
  return "pip";
}

export function detectFrameworks(dir: string): Integration[] {
  const deps = readDependencies(dir);
  const detected: Integration[] = [];

  for (const [integration, config] of Object.entries(FRAMEWORK_REGISTRY)) {
    if (integration === Integration.custom) continue;
    const match = config.detection.packages.some((pkg) => deps.has(pkg));
    if (match) detected.push(integration as Integration);
  }

  // If nothing matched from deps, try scanning imports
  if (detected.length === 0) {
    const importMatches = scanImports(dir);
    detected.push(...importMatches);
  }

  return detected;
}

function readDependencies(dir: string): Set<string> {
  const deps = new Set<string>();

  // pyproject.toml
  const pyproject = path.join(dir, "pyproject.toml");
  if (fs.existsSync(pyproject)) {
    try {
      const content = fs.readFileSync(pyproject, "utf-8");
      const parsed = loadToml(content) as Record<string, unknown>;
      const project = parsed.project as Record<string, unknown> | undefined;
      const depList = (project?.dependencies as string[]) ?? [];
      for (const dep of depList) {
        const name = dep.split(/[><=!~\[;]/)[0].trim().toLowerCase();
        if (name) deps.add(name);
      }
    } catch { /* malformed toml, skip */ }
  }

  // requirements.txt
  const reqTxt = path.join(dir, "requirements.txt");
  if (fs.existsSync(reqTxt)) {
    const lines = fs.readFileSync(reqTxt, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const name = trimmed.split(/[><=!~\[;]/)[0].trim().toLowerCase();
      if (name) deps.add(name);
    }
  }

  return deps;
}

function scanImports(dir: string): Integration[] {
  const detected: Integration[] = [];
  const pyFiles = findPyFiles(dir, 3); // max depth 3

  for (const file of pyFiles) {
    const content = fs.readFileSync(file, "utf-8");
    for (const [integration, config] of Object.entries(FRAMEWORK_REGISTRY)) {
      if (integration === Integration.custom) continue;
      if (config.detection.imports.some((pattern) => content.includes(pattern))) {
        if (!detected.includes(integration as Integration)) {
          detected.push(integration as Integration);
        }
      }
    }
  }

  return detected;
}

function findPyFiles(dir: string, maxDepth: number, depth = 0): string[] {
  if (depth > maxDepth) return [];
  const files: string[] = [];

  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__" || entry.name === ".venv") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findPyFiles(full, maxDepth, depth + 1));
      } else if (entry.name.endsWith(".py")) {
        files.push(full);
      }
    }
  } catch { /* permission error, skip */ }

  return files;
}
