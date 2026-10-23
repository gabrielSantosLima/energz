import { LlmAgent, type BaseLlm } from '@google/adk';

import { billDraftSchema } from '@/domain/agents/bill-parser-schema';

export const BILL_PARSER_INSTRUCTION = `You extract structured data from Brazilian electricity bills.

The user message contains raw OCR text from a scanned bill. Return only JSON that matches the provided schema.

Rules:
- amountCents is the total amount to pay, in integer cents (for example 91,12 -> 9112).
- activeKwh is the "Leit. Atual" value from the row that starts with "En Ativa". Do not calculate deltas.
- injectedKwh is the "Leit. Atual" value from the row that starts with "En Injetado". Do not calculate deltas.
- If a required value is missing or ambiguous, return null for that field instead of guessing.
- readingDate is the reading date in YYYY-MM-DD, or null when absent.
- charges is a flat list of label and amountCents; credits are negative (for example 60,07- -> -6007).
- Use null for any optional text field that is not present.
- Do not include markdown, explanations or code fences.`;

export function createBillParserAgent(model: BaseLlm): LlmAgent {
  return new LlmAgent({
    name: 'bill_parser',
    description: 'Extracts structured fields from electricity bill OCR text.',
    model,
    instruction: BILL_PARSER_INSTRUCTION,
    outputSchema: billDraftSchema,
    generateContentConfig: {
      temperature: 0,
    },
  });
}
