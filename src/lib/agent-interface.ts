import type { Language } from "./constants.js";
import { getCommandments } from "./commandments.js";

interface AgentMessage {
  type: string;
  content?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}

function formatToolStatus(name: string, input?: Record<string, unknown>): string {
  const file = input?.file_path as string | undefined;
  switch (name) {
    case "Read":    return `Reading ${file ?? "file"}`;
    case "Write":   return `Writing ${file ?? "file"}`;
    case "Edit":    return `Editing ${file ?? "file"}`;
    case "Bash": {
      const cmd = input?.command as string | undefined;
      if (cmd?.includes("axonpush-api-helper")) {
        const match = cmd.match(/axonpush-api-helper\.mjs\s+([\w-]+)(?:\s+(.+))?/);
        if (match) {
          const [, action, args] = match;
          switch (action) {
            case "list-apps":      return "Fetching AxonPush apps...";
            case "create-app":     return `Creating AxonPush app "${args ?? ""}"`;
            case "list-channels":  return "Fetching AxonPush channels...";
            case "create-channel": return `Creating AxonPush channel "${args?.split(/\s+/)[0] ?? ""}"`;
          }
        }
        return "Calling AxonPush API...";
      }
      return "Running command...";
    }
    case "Grep":    return `Searching for "${input?.pattern ?? "..."}"`;
    case "Glob":    return "Finding files...";
    default:        return `Using ${name}`;
  }
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
    const m = msg as any;
    messages.push(m);

    if (m.type === "assistant" && m.message?.content) {
      for (const block of m.message.content) {
        if (block.type === "text" && block.text) {
          for (const line of block.text.split("\n")) {
            const trimmed = line.trim();
            if (trimmed) onStatus(trimmed);
          }
        } else if (block.type === "tool_use" && block.name) {
          onStatus(formatToolStatus(block.name, block.input));
        }
      }
    } else if (m.type === "assistant" && m.content) {
      for (const line of String(m.content).split("\n")) {
        const trimmed = line.trim();
        if (trimmed) onStatus(trimmed);
      }
    } else if (m.type === "tool_progress" && m.tool_name) {
      onStatus(formatToolStatus(m.tool_name));
    }
  }
}
