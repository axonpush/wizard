import { Integration } from "../lib/constants.js";
import type { FrameworkConfig } from "../lib/framework-config.js";

export const CREWAI_CONFIG: FrameworkConfig = {
  name: "CrewAI",
  language: "python",
  integration: Integration.crewai,
  installPackage: "crewai",
  detection: {
    packages: ["crewai"],
    imports: ["from crewai", "import crewai"],
  },
  prompts: {
    integrationHint:
      "Add step_callback=callbacks.on_step and task_callback=callbacks.on_task_complete to Crew(), call on_crew_start() before and on_crew_end() after kickoff()",
  },
  skillDir: "skills/crewai",
};
