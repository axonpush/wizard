import { Integration, type Language } from "./constants.js";
import type { FrameworkConfig } from "./framework-config.js";
import { LANGCHAIN_CONFIG } from "../frameworks/langchain.js";
import { OPENAI_AGENTS_CONFIG } from "../frameworks/openai-agents.js";
import { ANTHROPIC_CONFIG } from "../frameworks/anthropic.js";
import { CREWAI_CONFIG } from "../frameworks/crewai.js";
import { DEEPAGENTS_CONFIG } from "../frameworks/deepagents.js";
import { CUSTOM_CONFIG } from "../frameworks/custom.js";
import { TS_LANGCHAIN_CONFIG } from "../frameworks/ts/langchain.js";
import { TS_LANGGRAPH_CONFIG } from "../frameworks/ts/langgraph.js";
import { TS_OPENAI_AGENTS_CONFIG } from "../frameworks/ts/openai-agents.js";
import { TS_ANTHROPIC_CONFIG } from "../frameworks/ts/anthropic.js";
import { TS_VERCEL_AI_CONFIG } from "../frameworks/ts/vercel-ai.js";
import { TS_MASTRA_CONFIG } from "../frameworks/ts/mastra.js";
import { TS_GOOGLE_ADK_CONFIG } from "../frameworks/ts/google-adk.js";
import { TS_LLAMAINDEX_CONFIG } from "../frameworks/ts/llamaindex.js";
import { TS_CUSTOM_CONFIG } from "../frameworks/ts/custom.js";

function key(language: Language, integration: Integration): string {
  return `${language}:${integration}`;
}

export const FRAMEWORK_REGISTRY: Record<string, FrameworkConfig> = {
  [key("python", Integration.langchain)]: LANGCHAIN_CONFIG,
  [key("python", Integration.openaiAgents)]: OPENAI_AGENTS_CONFIG,
  [key("python", Integration.anthropic)]: ANTHROPIC_CONFIG,
  [key("python", Integration.crewai)]: CREWAI_CONFIG,
  [key("python", Integration.deepAgents)]: DEEPAGENTS_CONFIG,
  [key("python", Integration.custom)]: CUSTOM_CONFIG,
  [key("typescript", Integration.langchain)]: TS_LANGCHAIN_CONFIG,
  [key("typescript", Integration.langgraph)]: TS_LANGGRAPH_CONFIG,
  [key("typescript", Integration.openaiAgents)]: TS_OPENAI_AGENTS_CONFIG,
  [key("typescript", Integration.anthropic)]: TS_ANTHROPIC_CONFIG,
  [key("typescript", Integration.vercelAi)]: TS_VERCEL_AI_CONFIG,
  [key("typescript", Integration.mastra)]: TS_MASTRA_CONFIG,
  [key("typescript", Integration.googleAdk)]: TS_GOOGLE_ADK_CONFIG,
  [key("typescript", Integration.llamaindex)]: TS_LLAMAINDEX_CONFIG,
  [key("typescript", Integration.tsCustom)]: TS_CUSTOM_CONFIG,
};

export function getConfig(language: Language, integration: Integration): FrameworkConfig | undefined {
  return FRAMEWORK_REGISTRY[key(language, integration)];
}

export function getConfigsForLanguage(language: Language): FrameworkConfig[] {
  return Object.values(FRAMEWORK_REGISTRY).filter((c) => c.language === language);
}
