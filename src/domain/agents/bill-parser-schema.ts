import { z } from 'zod';

export const billChargeSchema = z.object({
  label: z.string(),
  amountCents: z.number().int(),
  kind: z.enum(['discount', 'addition', 'info']).optional(),
});

export const billDraftSchema = z.object({
  distributor: z.string().nullable(),
  readingDate: z.string().nullable(),
  amountCents: z.number().int().nullable(),
  activeKwh: z.number().nullable(),
  injectedKwh: z.number().nullable(),
  charges: z.array(billChargeSchema),
  flag: z.string().nullable(),
});

export type BillDraftOutput = z.infer<typeof billDraftSchema>;
