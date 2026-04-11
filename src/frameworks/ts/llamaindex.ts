import { Integration } from "../../lib/constants.js";
import type { FrameworkConfig } from "../../lib/framework-config.js";

export const TS_LLAMAINDEX_CONFIG: FrameworkConfig = {
  name: "LlamaIndex (TS)",
  language: "typescript",
  integration: Integration.llamaindex,
  installPackage: "@axonpush/sdk",
  detection: {
    packages: ["llamaindex"],
    imports: ["from \"llamaindex", "from 'llamaindex"],
  },
  prompts: {
    integrationHint:
      "Create AxonPushLlamaIndexHandler and call onLLMStart/onLLMEnd, onRetrieverStart/onRetrieverEnd, onQueryStart/onQueryEnd at the appropriate points",
  },
  skillDir: "skills/ts-llamaindex",
  commandmentGroup: Integration.llamaindex,
};
