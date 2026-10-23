import {
  BaseLlm,
  genaiSchemaToJsonSchema,
  type BaseLlmConnection,
  type LlmRequest,
  type LlmResponse,
} from '@google/adk';

const DEEPINFRA_CHAT_COMPLETIONS_URL =
  'https://api.deepinfra.com/v1/openai/chat/completions';
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 2;

type Content = LlmRequest['contents'][number];
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionResponse = {
  choices?: {
    message?: { content?: string | null };
    finish_reason?: string | null;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export class DeepInfraRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'DeepInfraRequestError';
  }
}

function contentToText(content: Content): string {
  const parts = content.parts ?? [];
  return parts
    .map((part) => {
      if (part.text) {
        return part.text;
      }
      if (part.functionCall) {
        return JSON.stringify(part.functionCall);
      }
      if (part.functionResponse) {
        return JSON.stringify(part.functionResponse);
      }
      return '';
    })
    .join('');
}

function normalizeSystemInstruction(instruction: unknown): string | null {
  if (!instruction) {
    return null;
  }
  if (typeof instruction === 'string') {
    return instruction;
  }
  if (Array.isArray(instruction)) {
    return instruction
      .map((part) => {
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .join('');
  }
  if (typeof instruction === 'object' && 'parts' in instruction) {
    return contentToText(instruction as Content);
  }
  return null;
}

export class DeepInfraLlm extends BaseLlm {
  private readonly apiKey: string;

  constructor(params: { model: string; apiKey: string }) {
    super({ model: params.model });
    this.apiKey = params.apiKey;
  }

  async *generateContentAsync(
    llmRequest: LlmRequest,
    _stream = false,
    abortSignal?: AbortSignal,
  ): AsyncGenerator<LlmResponse, void> {
    const messages: ChatMessage[] = [];

    const systemInstruction = normalizeSystemInstruction(
      llmRequest.config?.systemInstruction,
    );
    const responseSchema = llmRequest.config?.responseSchema;
    const schemaInstruction = responseSchema
      ? `Return only JSON that matches this JSON Schema:\n${JSON.stringify(
          genaiSchemaToJsonSchema(responseSchema),
        )}`
      : null;
    const systemText = [systemInstruction, schemaInstruction]
      .filter(Boolean)
      .join('\n\n');

    if (systemText) {
      messages.push({ role: 'system', content: systemText });
    }

    for (const content of llmRequest.contents) {
      const role = content.role === 'model' ? 'assistant' : 'user';
      const text = contentToText(content);
      if (text) {
        messages.push({ role, content: text });
      }
    }

    const body = {
      model: this.model,
      messages,
      temperature: llmRequest.config?.temperature ?? 0,
      max_tokens: llmRequest.config?.maxOutputTokens,
      response_format:
        responseSchema || llmRequest.config?.responseMimeType === 'application/json'
          ? { type: 'json_object' }
          : undefined,
    };

    const completion = await this.request(body, abortSignal);

    const text = completion.choices?.[0]?.message?.content ?? '';
    const usage = completion.usage;

    yield {
      content: {
        role: 'model',
        parts: [{ text }],
      },
      partial: false,
      turnComplete: true,
      usageMetadata: usage
        ? {
            promptTokenCount: usage.prompt_tokens,
            candidatesTokenCount: usage.completion_tokens,
            totalTokenCount: usage.total_tokens,
          }
        : undefined,
    };
  }

  async connect(_llmRequest: LlmRequest): Promise<BaseLlmConnection> {
    throw new Error('Live connections are not supported by DeepInfraLlm.');
  }

  private async request(
    body: Record<string, unknown>,
    abortSignal?: AbortSignal,
  ): Promise<ChatCompletionResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      abortSignal?.addEventListener('abort', onAbort);
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(DEEPINFRA_CHAT_COMPLETIONS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const error = new DeepInfraRequestError(
            response.status,
            `DeepInfra request failed with status ${response.status}: ${errorBody.slice(0, 300)}`,
          );
          if (response.status === 429 || response.status >= 500) {
            lastError = error;
            continue;
          }
          throw error;
        }

        return (await response.json()) as ChatCompletionResponse;
      } catch (error) {
        if (error instanceof DeepInfraRequestError) {
          throw error;
        }
        if (abortSignal?.aborted) {
          throw error;
        }
        lastError = error;
      } finally {
        clearTimeout(timeout);
        abortSignal?.removeEventListener('abort', onAbort);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('DeepInfra request failed.');
  }
}
