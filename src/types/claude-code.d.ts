declare module "@anthropic-ai/claude-agent-sdk" {
  interface QueryOptions {
    cwd?: string;
    allowedTools?: string[];
    systemPrompt?: string;
  }

  interface QueryParams {
    prompt: string;
    options?: QueryOptions;
  }

  function query(params: QueryParams): AsyncIterable<unknown>;
}
