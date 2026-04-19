import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_LANGCHAIN_CONFIG: FrameworkConfig = {
  name: "LangChain (TS)",
  language: "typescript",
  integration: Integration.langchain,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["@langchain/core", "@langchain/openai", "@langchain/anthropic", "langchain"],
    imports: ["from @langchain/", "from \"@langchain/", "from 'langchain"],
  },
  prompts: {
    integrationHint:
      'Add AxonPushCallbackHandler to chain.invoke() via config: { callbacks: [handler] }',
  },
  skillDir: "skills/ts-langchain",
  remoteSkillKey: "LangChain",
  commandmentGroup: Integration.langchain,
};
