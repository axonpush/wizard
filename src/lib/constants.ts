export enum Integration {
  langchain = "langchain",
  openaiAgents = "openai-agents",
  anthropic = "anthropic",
  crewai = "crewai",
  deepAgents = "deepagents",
  custom = "custom",
}

export const INTEGRATION_LABELS: Record<Integration, string> = {
  [Integration.langchain]: "LangChain / LangGraph",
  [Integration.openaiAgents]: "OpenAI Agents SDK",
  [Integration.anthropic]: "Anthropic / Claude",
  [Integration.crewai]: "CrewAI",
  [Integration.deepAgents]: "LangChain Deep Agents",
  [Integration.custom]: "Custom / Unsupported Framework",
};

export const DEFAULT_BASE_URL = "https://api.axonpush.xyz";
