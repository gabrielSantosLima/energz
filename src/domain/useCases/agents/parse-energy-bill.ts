import { InMemoryRunner } from '@google/adk';
import { injectable } from 'tsyringe';

import { createBillParserAgent } from '@/domain/agents/bill-parser-agent';
import { billDraftSchema } from '@/domain/agents/bill-parser-schema';
import type { AgentSettings } from '@/domain/entities/agent-settings';
import type { BillDraft } from '@/domain/entities/energy-bill';
import {
  DeepInfraLlm,
  DeepInfraRequestError,
} from '@/domain/services/agents/deepinfra-llm';
import { ImageDataReader } from '@/domain/services/image-data-reader';
import { GetAgentSettingsUseCase } from '@/domain/useCases/agents/get-agent-settings';

const MAX_ATTEMPTS = 2;

/**
 * Models without vision support reject image parts. When that happens the
 * request is retried with the OCR text only.
 */
const IMAGE_FALLBACK_STATUSES = new Set([400, 404, 413, 422]);

export class AgentNotConfiguredError extends Error {
  constructor() {
    super('No AI provider is configured.');
    this.name = 'AgentNotConfiguredError';
  }
}

export class BillParseError extends Error {
  constructor(
    message: string,
    readonly issues: string[],
  ) {
    super(message);
    this.name = 'BillParseError';
  }
}

export type ParseEnergyBillResult = {
  draft: BillDraft;
  latencyMs: number;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } | null;
};

type AttachedImage = {
  data: string;
  mimeType: string;
};

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return text.trim();
  }
  return text.slice(start, end + 1);
}

@injectable()
export class ParseEnergyBillUseCase {
  constructor(
    private readonly getAgentSettings: GetAgentSettingsUseCase,
    private readonly images: ImageDataReader,
  ) {}

  async execute(
    ocrText: string,
    imageUri?: string,
  ): Promise<ParseEnergyBillResult> {
    const settings = await this.getAgentSettings.execute();
    if (!settings) {
      throw new AgentNotConfiguredError();
    }

    const startedAt = Date.now();
    const image = imageUri ? await this.loadImage(imageUri) : null;

    try {
      return await this.parse(settings, ocrText, image, startedAt);
    } catch (error) {
      const canRetryWithoutImage =
        image !== null &&
        error instanceof DeepInfraRequestError &&
        IMAGE_FALLBACK_STATUSES.has(error.status);

      if (!canRetryWithoutImage) {
        throw error;
      }

      return this.parse(settings, ocrText, null, startedAt);
    }
  }

  private async loadImage(uri: string): Promise<AttachedImage> {
    return {
      data: await this.images.readBase64(uri),
      mimeType: this.images.mimeType(uri),
    };
  }

  private async parse(
    settings: AgentSettings,
    ocrText: string,
    image: AttachedImage | null,
    startedAt: number,
  ): Promise<ParseEnergyBillResult> {
    const model = new DeepInfraLlm({
      model: settings.model,
      apiKey: settings.apiKey,
    });
    const agent = createBillParserAgent(model);
    const runner = new InMemoryRunner({ agent, appName: 'energz' });

    let lastIssues: string[] = [];
    let usage: ParseEnergyBillResult['usage'] = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const repair =
        attempt > 0
          ? `\n\nYour previous answer failed validation:\n${lastIssues.join('\n')}\nReturn a corrected JSON object only.`
          : '';
      const imageHint = image
        ? '\n\nA photo of the bill is attached. Use it to confirm values when the OCR text is ambiguous or corrupted.'
        : '';

      const message = {
        role: 'user' as const,
        parts: [
          { text: `BILL OCR TEXT:\n${ocrText}${imageHint}${repair}` },
          ...(image
            ? [
                {
                  inlineData: {
                    mimeType: image.mimeType,
                    data: image.data,
                  },
                },
              ]
            : []),
        ],
      };

      let output = '';

      for await (const event of runner.runEphemeral({
        userId: 'local-user',
        newMessage: message,
      })) {
        const text = (event.content?.parts ?? [])
          .map((part) => part.text ?? '')
          .join('');
        if (text.trim()) {
          output = text;
        }
        if (event.usageMetadata) {
          usage = {
            promptTokens: event.usageMetadata.promptTokenCount,
            completionTokens: event.usageMetadata.candidatesTokenCount,
            totalTokens: event.usageMetadata.totalTokenCount,
          };
        }
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(extractJson(output));
      } catch (error) {
        lastIssues = [
          error instanceof Error ? error.message : 'Response was not valid JSON.',
        ];
        continue;
      }

      const result = billDraftSchema.safeParse(parsedJson);
      if (result.success) {
        return {
          draft: result.data,
          latencyMs: Date.now() - startedAt,
          usage,
        };
      }

      lastIssues = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
    }

    throw new BillParseError(
      'The agent could not return valid bill data.',
      lastIssues,
    );
  }
}
