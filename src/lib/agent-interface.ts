import type { Language } from "./constants.js";
import { getCommandments } from "./commandments.js";

interface AgentMessage {
  type: string;
  content?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}

export async function runAgent(
  prompt: string,
  cwd: string,
  onStatus: (msg: string) => void,
  language: Language = "python",
): Promise<void> {
  const { query } = await import("@anthropic-ai/claude-agent-sdk");

  const messages: AgentMessage[] = [];

  const expertise =
    language === "typescript"
      ? "You are an expert TypeScript/Node.js developer integrating the AxonPush TypeScript SDK (@axonpush/sdk) into a project."
      : "You are an expert Python developer integrating the AxonPush observability SDK into a project.";

  const response = query({
    prompt,
    options: {
      cwd,
      allowedTools: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash",
      ],
      systemPrompt: `${expertise} Follow these rules:\n\n${getCommandments(language)}`,
    },
  });

  for await (const msg of response) {
    const m = msg as AgentMessage;
    messages.push(m);

    if (m.type === "assistant" && m.content) {
      for (const line of String(m.content).split("\n")) {
        const trimmed = line.trim();
        if (trimmed) onStatus(trimmed);
      }
    }
  }
}
