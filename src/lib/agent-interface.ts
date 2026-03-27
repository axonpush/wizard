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
): Promise<void> {
  const { query } = await import("@anthropic-ai/claude-code");

  const messages: AgentMessage[] = [];

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
      systemPrompt: `You are an expert Python developer integrating the AxonPush observability SDK into a project. Follow these rules:\n\n${getCommandments()}`,
    },
  });

  for await (const message of response) {
    messages.push(message as AgentMessage);

    if ((message as AgentMessage).type === "assistant" && (message as AgentMessage).content) {
      // Extract status lines (lines starting with [STATUS])
      const content = String((message as AgentMessage).content);
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          onStatus(trimmed);
        }
      }
    }
  }
}
