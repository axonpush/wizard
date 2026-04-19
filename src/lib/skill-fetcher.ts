import { Integration, type Language } from "./constants.js";

const PYTHON_README_URL =
  "https://raw.githubusercontent.com/axonpush/python-sdk/main/README.md";
const TS_README_URL =
  "https://raw.githubusercontent.com/axonpush/ts-sdk/main/README.md";

const FETCH_TIMEOUT_MS = 5_000;

const PYTHON_HEADING_MAP: Record<string, Integration> = {
  langchain: Integration.langchain,
  langgraph: Integration.langchain,
  "langchain / langgraph": Integration.langchain,
  "openai agents": Integration.openaiAgents,
  "openai agents sdk": Integration.openaiAgents,
  anthropic: Integration.anthropic,
  "anthropic / claude": Integration.anthropic,
  claude: Integration.anthropic,
  crewai: Integration.crewai,
  "deep agents": Integration.deepAgents,
  deepagents: Integration.deepAgents,
  "langchain deep agents": Integration.deepAgents,
  opentelemetry: Integration.otel,
  otel: Integration.otel,
  custom: Integration.custom,
  "custom events": Integration.custom,
  "event publishing": Integration.custom,
};

const TS_HEADING_MAP: Record<string, Integration> = {
  langchain: Integration.langchain,
  "langchain.js": Integration.langchain,
  langgraph: Integration.langgraph,
  "langgraph.js": Integration.langgraph,
  anthropic: Integration.anthropic,
  "anthropic / claude": Integration.anthropic,
  claude: Integration.anthropic,
  "openai agents": Integration.openaiAgents,
  "openai agents sdk": Integration.openaiAgents,
  "vercel ai": Integration.vercelAi,
  "vercel ai sdk": Integration.vercelAi,
  mastra: Integration.mastra,
  "google adk": Integration.googleAdk,
  "google ai development kit": Integration.googleAdk,
  llamaindex: Integration.llamaindex,
  "llamaindex.ts": Integration.llamaindex,
  opentelemetry: Integration.otel,
  otel: Integration.otel,
  custom: Integration.tsCustom,
  "custom events": Integration.tsCustom,
  "event publishing": Integration.tsCustom,
};

let cachedPython: Map<Integration, string> | undefined;
let cachedTs: Map<Integration, string> | undefined;

function headingMap(language: Language): Record<string, Integration> {
  return language === "typescript" ? TS_HEADING_MAP : PYTHON_HEADING_MAP;
}

function readmeUrl(language: Language): string {
  return language === "typescript" ? TS_README_URL : PYTHON_README_URL;
}

function cache(language: Language): Map<Integration, string> | undefined {
  return language === "typescript" ? cachedTs : cachedPython;
}

function setCache(language: Language, map: Map<Integration, string>): void {
  if (language === "typescript") cachedTs = map;
  else cachedPython = map;
}

function parseReadmeIntoSections(
  readme: string,
  mapping: Record<string, Integration>,
): Map<Integration, string> {
  const result = new Map<Integration, string>();
  const lines = readme.split("\n");
  let currentIntegration: Integration | null = null;
  let currentLines: string[] = [];

  function flushSection(): void {
    if (currentIntegration && currentLines.length > 0) {
      const existing = result.get(currentIntegration);
      const content = currentLines.join("\n").trim();
      if (existing) {
        result.set(currentIntegration, existing + "\n\n" + content);
      } else {
        result.set(currentIntegration, content);
      }
    }
    currentLines = [];
    currentIntegration = null;
  }

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      flushSection();
      const heading = headingMatch[1].trim();
      const normalized = heading.toLowerCase().replace(/[^a-z0-9\s/.]/g, "").trim();
      currentIntegration = mapping[normalized] ?? null;

      if (!currentIntegration) {
        for (const [key, integration] of Object.entries(mapping)) {
          if (normalized.includes(key)) {
            currentIntegration = integration;
            break;
          }
        }
      }

      if (currentIntegration) {
        currentLines.push(line);
      }
    } else if (currentIntegration) {
      currentLines.push(line);
    }
  }

  flushSection();
  return result;
}

async function fetchReadme(language: Language): Promise<string | null> {
  const url = readmeUrl(language);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function prefetchSkills(
  language: Language,
): Promise<Map<Integration, string>> {
  const existing = cache(language);
  if (existing) return existing;

  const readme = await fetchReadme(language);
  if (!readme) {
    const empty = new Map<Integration, string>();
    setCache(language, empty);
    return empty;
  }

  const mapping = headingMap(language);
  const sections = parseReadmeIntoSections(readme, mapping);
  setCache(language, sections);
  return sections;
}
