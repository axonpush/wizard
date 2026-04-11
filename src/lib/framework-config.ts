import type { Integration, Language } from "./constants.js";

export type CommandmentGroup = "core" | Integration;

export interface FrameworkConfig {
  name: string;
  language: Language;
  integration: Integration;
  installPackage: string;
  detection: {
    packages: string[];
    imports: string[];
  };
  prompts: {
    integrationHint: string;
  };
  skillDir: string;
  internal?: boolean;
  extraTsPackages?: string[];
  commandmentGroup?: CommandmentGroup;
}
