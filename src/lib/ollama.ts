import { OLLAMA_BASE_URL } from "./env";

export type OllamaMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type OllamaChatOptions = {
  model: string;
  messages: OllamaMessage[];
};

export async function chatOllama(options: OllamaChatOptions): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false,
    }),
  });
  const data = await res.json();
  return data.message.content as string;
}

export type OllamaStreamChunk = {
  content?: string;
  thinking?: string;
};

export async function* streamChatOllama(
  options: OllamaChatOptions,
): AsyncGenerator<OllamaStreamChunk, void, unknown> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
    }),
  });

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Ollama streams NDJSON: one JSON object per line (no "data: " prefix).
      // Some proxies wrap SSE as "data: {...}" — support both.
      let raw = trimmed;
      if (trimmed.startsWith("data: ")) {
        raw = trimmed.slice(6).trim();
        if (raw === "[DONE]") return;
      }

      try {
        const data = JSON.parse(raw) as {
          message?: { content?: string; thinking?: string };
          done?: boolean;
        };

        const chunk: OllamaStreamChunk = {};
        if (data.message?.content) {
          chunk.content = data.message.content;
        }
        if (data.message?.thinking) {
          chunk.thinking = data.message.thinking;
        }

        if (chunk.content || chunk.thinking) {
          yield chunk;
        }

        if (data.done) return;
      } catch {
        // skip malformed / partial lines
      }
    }
  }
}
