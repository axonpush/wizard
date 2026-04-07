import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_LANGGRAPH_CONFIG: FrameworkConfig = {
  name: "LangGraph (TS)",
  language: "typescript",
  integration: Integration.langgraph,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["@langchain/langgraph"],
    imports: ["from \"@langchain/langgraph", "from '@langchain/langgraph"],
  },
  prompts: {
    integrationHint:
      'Add AxonPushLangGraphHandler to graph.invoke() via config: { callbacks: [handler] }. It extends the LangChain handler with graph node-level tracing.',
  },
  skillDir: "skills/ts-langgraph",
};
