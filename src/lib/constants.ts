export enum Integration {
  langchain = "langchain",
  openaiAgents = "openai-agents",
  anthropic = "anthropic",
  crewai = "crewai",
  core = "core",
}

export const INTEGRATION_LABELS: Record<Integration, string> = {
  [Integration.langchain]: "LangChain / LangGraph",
  [Integration.openaiAgents]: "OpenAI Agents SDK",
  [Integration.anthropic]: "Anthropic / Claude",
  [Integration.crewai]: "CrewAI",
  [Integration.core]: "Core SDK (no framework)",
};

export const DEFAULT_BASE_URL = "http://localhost:3000";
