import { Integration } from "./constants.js";

export interface FrameworkConfig {
  name: string;
  integration: Integration;
  packageExtra: string; // "langchain" → pip install axonpush[langchain]
  detection: {
    packages: string[]; // dep names in pyproject.toml / requirements.txt
    imports: string[]; // import patterns to grep for
  };
  prompts: {
    integrationHint: string;
  };
  skillDir: string;
}
