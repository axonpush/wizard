export type Language = "python" | "typescript";

export enum Integration {
  langchain = "langchain",
  openaiAgents = "openai-agents",
  anthropic = "anthropic",
  crewai = "crewai",
  deepAgents = "deepagents",
  custom = "custom",
  vercelAi = "vercel-ai",
  mastra = "mastra",
  googleAdk = "google-adk",
  llamaindex = "llamaindex",
  langgraph = "langgraph",
  tsCustom = "ts-custom",
}

export const INTEGRATION_LABELS: Record<Integration, string> = {
  [Integration.langchain]: "LangChain / LangGraph",
  [Integration.openaiAgents]: "OpenAI Agents SDK",
  [Integration.anthropic]: "Anthropic / Claude",
  [Integration.crewai]: "CrewAI",
  [Integration.deepAgents]: "LangChain Deep Agents",
  [Integration.custom]: "Custom / Unsupported Framework",
  [Integration.vercelAi]: "Vercel AI SDK",
  [Integration.mastra]: "Mastra",
  [Integration.googleAdk]: "Google ADK",
  [Integration.llamaindex]: "LlamaIndex",
  [Integration.langgraph]: "LangGraph",
  [Integration.tsCustom]: "Custom / Unsupported Framework (TS)",
};

export const DEFAULT_BASE_URL = "https://api.axonpush.xyz";
