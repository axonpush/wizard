import { Integration } from "./constants.js";
import type { FrameworkConfig } from "./framework-config.js";
import { LANGCHAIN_CONFIG } from "../frameworks/langchain.js";
import { OPENAI_AGENTS_CONFIG } from "../frameworks/openai-agents.js";
import { ANTHROPIC_CONFIG } from "../frameworks/anthropic.js";
import { CREWAI_CONFIG } from "../frameworks/crewai.js";
import { DEEPAGENTS_CONFIG } from "../frameworks/deepagents.js";
import { CUSTOM_CONFIG } from "../frameworks/custom.js";

export const FRAMEWORK_REGISTRY: Record<Integration, FrameworkConfig> = {
  [Integration.langchain]: LANGCHAIN_CONFIG,
  [Integration.openaiAgents]: OPENAI_AGENTS_CONFIG,
  [Integration.anthropic]: ANTHROPIC_CONFIG,
  [Integration.crewai]: CREWAI_CONFIG,
  [Integration.deepAgents]: DEEPAGENTS_CONFIG,
  [Integration.custom]: CUSTOM_CONFIG,
};
