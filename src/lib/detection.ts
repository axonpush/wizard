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

/**
 * Logging libraries we know how to forward to AxonPush via the official
 * SDK integrations (axonpush-ts and axonpush-python).
 *
 * Detected libraries are reported back to the wizard's setup agent so it
 * can suggest the appropriate logger integration during the setup flow.
 *
 * Stdlib options (`console`, `print`/`logging`) are always available — they're
 * the fallback when no third-party logger is detected.
 */
export type LogLibrary =
  // TypeScript / Node
  | "console"
  | "pino"
  | "winston"
  | "bunyan"
  // Python
  | "print"
  | "logging"
  | "loguru"
  | "structlog";

export function detectLogLibraries(dir: string, language: Language): LogLibrary[] {
  if (language === "typescript") {
    const deps = readTsDependencies(dir);
    const found: LogLibrary[] = [];
    if (deps.has("pino")) found.push("pino");
    if (deps.has("winston")) found.push("winston");
    if (deps.has("bunyan")) found.push("bunyan");
    // `console` is always available; we report it last as the fallback.
    found.push("console");
    return found;
  }

  const deps = readPyDependencies(dir);
  const found: LogLibrary[] = [];
  if (deps.has("loguru")) found.push("loguru");
  if (deps.has("structlog")) found.push("structlog");
  // stdlib `logging` is always available
  found.push("logging");
  // `print()` capture is the fallback for agent projects with free-form output
  found.push("print");
  return found;
}

/**
 * Returns the import + setup snippet the wizard should suggest for a given
 * detected logging library, in the format the setup agent can paste into the
 * user's project.
 */
export function getLogIntegrationSnippet(library: LogLibrary): {
  importStmt: string;
  setup: string;
  notes: string;
} {
  switch (library) {
    case "pino":
      return {
        importStmt: `import { createAxonPushPinoStream } from '@axonpush/sdk/integrations/pino';`,
        setup: `const stream = createAxonPushPinoStream({ client, channelId, serviceName: 'my-service' });
const log = pino({ level: 'info' }, stream);`,
        notes: "Pino transport — pass the returned stream as the second arg to pino().",
      };
    case "winston":
      return {
        importStmt: `import { createAxonPushWinstonTransport } from '@axonpush/sdk/integrations/winston';`,
        setup: `const transport = await createAxonPushWinstonTransport({ client, channelId, serviceName: 'my-service' });
const log = winston.createLogger({ transports: [transport] });`,
        notes: "Winston transport — async constructor, await the result.",
      };
    case "bunyan":
      return {
        importStmt: `// Bunyan is not directly supported. Use the console capture as a fallback.`,
        setup: `import { setupConsoleCapture } from '@axonpush/sdk/integrations/console';
setupConsoleCapture({ client, channelId, source: 'app', serviceName: 'my-service' });`,
        notes: "Bunyan support is not yet built; recommend setupConsoleCapture as a fallback.",
      };
    case "console":
      return {
        importStmt: `import { setupConsoleCapture } from '@axonpush/sdk/integrations/console';`,
        setup: `setupConsoleCapture({ client, channelId, source: 'agent' });`,
        notes: "Patches global console.* methods. Use source: 'app' for backend services.",
      };
    case "loguru":
      return {
        importStmt: `from axonpush.integrations.loguru import create_axonpush_loguru_sink`,
        setup: `from loguru import logger
sink = create_axonpush_loguru_sink(client=client, channel_id=channel_id, service_name="my-service")
logger.add(sink, serialize=True)  # serialize=True is required`,
        notes: "Loguru sink. Requires axonpush[loguru] extra. serialize=True is mandatory.",
      };
    case "structlog":
      return {
        importStmt: `from axonpush.integrations.structlog import axonpush_structlog_processor`,
        setup: `forwarder = axonpush_structlog_processor(client=client, channel_id=channel_id, service_name="my-service")
structlog.configure(processors=[..., forwarder, structlog.processors.JSONRenderer()])`,
        notes: "Structlog processor. Requires axonpush[structlog] extra. Place BEFORE the renderer.",
      };
    case "logging":
      return {
        importStmt: `from axonpush.integrations.logging_handler import AxonPushLoggingHandler`,
        setup: `handler = AxonPushLoggingHandler(client=client, channel_id=channel_id, service_name="my-service")
logging.getLogger().addHandler(handler)`,
        notes: "Stdlib logging handler. No extra dependency needed.",
      };
    case "print":
      return {
        importStmt: `from axonpush.integrations.print_capture import setup_print_capture`,
        setup: `setup_print_capture(client, channel_id=channel_id, source="agent")`,
        notes: "Tees sys.stdout/sys.stderr. Use source='app' for backend services.",
      };
  }
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

export function readPyDependencies(dir: string): Set<string> {
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

export function readTsDependencies(dir: string): Set<string> {
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
