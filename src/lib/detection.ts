import fs from "fs";
import path from "path";
import { load as loadToml } from "js-toml";
import { Integration, type Language } from "./constants.js";
import { getConfigsForLanguage } from "./registry.js";

export type PythonPackageManager = "uv" | "poetry" | "pip";
export type TsPackageManager = "bun" | "pnpm" | "yarn" | "npm";
export type PackageManager = PythonPackageManager | TsPackageManager;

export function detectPyPackageManager(dir: string): PythonPackageManager {
  if (fs.existsSync(path.join(dir, "uv.lock"))) return "uv";
  if (fs.existsSync(path.join(dir, "poetry.lock"))) return "poetry";
  return "pip";
}

export function detectTsPackageManager(dir: string): TsPackageManager {
  if (fs.existsSync(path.join(dir, "bun.lock")) || fs.existsSync(path.join(dir, "bun.lockb"))) return "bun";
  if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(dir, "yarn.lock"))) return "yarn";
  return "npm";
}

export function detectPackageManager(dir: string, language: Language): PackageManager {
  if (language === "typescript") return detectTsPackageManager(dir);
  return detectPyPackageManager(dir);
}

export function detectLanguage(dir: string): "python" | "typescript" | "both" {
  const hasPython =
    fs.existsSync(path.join(dir, "pyproject.toml")) ||
    fs.existsSync(path.join(dir, "requirements.txt"));
  const hasTs = fs.existsSync(path.join(dir, "package.json"));

  if (hasPython && hasTs) return "both";
  if (hasTs) return "typescript";
  return "python";
}

export function detectFrameworks(dir: string, language: Language): Integration[] {
  if (language === "typescript") return detectTsFrameworks(dir);
  return detectPyFrameworks(dir);
}

function detectPyFrameworks(dir: string): Integration[] {
  const deps = readPyDependencies(dir);
  const detected: Integration[] = [];
  const configs = getConfigsForLanguage("python");

  for (const config of configs) {
    if (config.integration === Integration.custom) continue;
    if (config.detection.packages.some((pkg) => deps.has(pkg))) {
      detected.push(config.integration);
    }
  }

  if (detected.length === 0) {
    const importMatches = scanPyImports(dir);
    detected.push(...importMatches);
  }

  return detected;
}

function detectTsFrameworks(dir: string): Integration[] {
  const deps = readTsDependencies(dir);
  const detected: Integration[] = [];
  const configs = getConfigsForLanguage("typescript");

  for (const config of configs) {
    if (config.integration === Integration.tsCustom) continue;
    if (config.detection.packages.some((pkg) => deps.has(pkg))) {
      detected.push(config.integration);
    }
  }

  if (detected.length === 0) {
    const importMatches = scanTsImports(dir);
    detected.push(...importMatches);
  }

  return detected;
}

function readPyDependencies(dir: string): Set<string> {
  const deps = new Set<string>();

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
    } catch {}
  }

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

function readTsDependencies(dir: string): Set<string> {
  const deps = new Set<string>();

  const pkgPath = path.join(dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const content = fs.readFileSync(pkgPath, "utf-8");
      const parsed = JSON.parse(content) as Record<string, unknown>;
      for (const field of ["dependencies", "devDependencies"]) {
        const depObj = parsed[field] as Record<string, string> | undefined;
        if (depObj) {
          for (const name of Object.keys(depObj)) {
            deps.add(name);
          }
        }
      }
    } catch {}
  }

  return deps;
}

function scanPyImports(dir: string): Integration[] {
  const detected: Integration[] = [];
  const pyFiles = findPyFiles(dir, 3);
  const configs = getConfigsForLanguage("python");

  for (const file of pyFiles) {
    const content = fs.readFileSync(file, "utf-8");
    for (const config of configs) {
      if (config.integration === Integration.custom) continue;
      if (config.detection.imports.some((pattern) => content.includes(pattern))) {
        if (!detected.includes(config.integration)) {
          detected.push(config.integration);
        }
      }
    }
  }

  return detected;
}

function scanTsImports(dir: string): Integration[] {
  const detected: Integration[] = [];
  const tsFiles = findTsFiles(dir, 3);
  const configs = getConfigsForLanguage("typescript");

  for (const file of tsFiles) {
    const content = fs.readFileSync(file, "utf-8");
    for (const config of configs) {
      if (config.integration === Integration.tsCustom) continue;
      if (config.detection.imports.some((pattern) => content.includes(pattern))) {
        if (!detected.includes(config.integration)) {
          detected.push(config.integration);
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
  } catch {}

  return files;
}

function findTsFiles(dir: string, maxDepth: number, depth = 0): string[] {
  if (depth > maxDepth) return [];
  const files: string[] = [];
  const skipDirs = new Set(["node_modules", "dist", ".next", ".nuxt", "build", "coverage"]);

  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findTsFiles(full, maxDepth, depth + 1));
      } else if (/\.(ts|tsx|mts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        files.push(full);
      }
    }
  } catch {}

  return files;
}
