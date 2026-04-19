import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const LANGCHAIN_CONFIG: FrameworkConfig = {
  name: "LangChain / LangGraph",
  language: "python",
  integration: Integration.langchain,
  installPackage: "langchain",
  detection: {
    packages: ["langchain", "langchain-core", "langchain-openai", "langchain-anthropic", "langgraph"],
    imports: ["from langchain", "import langchain", "from langgraph"],
  },
  prompts: {
    integrationHint:
      'Add AxonPushCallbackHandler to chain.invoke() via config={"callbacks": [handler]}',
  },
  skillDir: "skills/langchain",
  remoteSkillKey: "LangChain",
  commandmentGroup: Integration.langchain,
};
