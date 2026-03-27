import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const LANGCHAIN_CONFIG: FrameworkConfig = {
  name: "LangChain / LangGraph",
  integration: Integration.langchain,
  packageExtra: "langchain",
  detection: {
    packages: ["langchain", "langchain-core", "langchain-openai", "langchain-anthropic", "langgraph"],
    imports: ["from langchain", "import langchain", "from langgraph"],
  },
  prompts: {
    integrationHint:
      'Add AxonPushCallbackHandler to chain.invoke() via config={"callbacks": [handler]}',
  },
  skillDir: "skills/langchain",
};
