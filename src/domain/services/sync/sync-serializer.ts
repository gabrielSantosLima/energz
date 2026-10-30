import * as Crypto from 'expo-crypto';
import { injectable } from 'tsyringe';
import { z } from 'zod';

import {
  SYNC_PROTOCOL_VERSION,
  type SyncEnvelope,
  type SyncEnvelopePayload,
} from '@/domain/entities/sync';
import {
  SyncChecksumError,
  SyncPayloadError,
  SyncVersionError,
} from '@/domain/errors/sync-errors';

const originSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().max(80),
  receivedAt: z.number().int().nonnegative(),
});

const measurementSchema = z.object({
  id: z.string().min(1),
  measuredAt: z.number().int(),
  consumption: z.number().finite(),
  production: z.number().finite(),
  endsCycle: z.boolean(),
  restart: z.boolean(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  origin: originSchema.nullable().default(null),
});

const chargeSchema = z.object({
  label: z.string(),
  amountCents: z.number().int(),
  kind: z.enum(['discount', 'addition', 'info']).optional(),
});

const billSchema = z.object({
  id: z.string().min(1),
  distributor: z.string().nullable(),
  readingDate: z.number().int().nullable(),
  amountCents: z.number().int(),
  activeKwh: z.number().finite(),
  injectedKwh: z.number().finite(),
  charges: z.array(chargeSchema),
  flag: z.string().nullable(),
  source: z.enum(['agent', 'manual']),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  origin: originSchema.nullable().default(null),
});

const tombstoneSchema = z.object({
  entity: z.enum(['measurement', 'bill']),
  id: z.string().min(1),
  deletedAt: z.number().int(),
});

const envelopeSchema = z.object({
  protocolVersion: z.number().int(),
  schemaVersion: z.number().int(),
  appVersion: z.string(),
  deviceId: z.string().min(1),
  deviceName: z.string(),
  exportedAt: z.number().int(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/i),
  measurements: z.array(measurementSchema),
  bills: z.array(billSchema),
  tombstones: z.array(tombstoneSchema),
});

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(
      ([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry)}`,
    );

  return `{${entries.join(',')}}`;
}

@injectable()
export class SyncSerializer {
  private async checksum(payload: SyncEnvelopePayload): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      canonicalize(payload),
    );
  }

  async sign(payload: SyncEnvelopePayload): Promise<SyncEnvelope> {
    const checksum = await this.checksum(payload);
    return { ...payload, checksum };
  }

  toJson(envelope: SyncEnvelope): string {
    return JSON.stringify(envelope);
  }

  async parse(text: string): Promise<SyncEnvelope> {
    let json: unknown;

    try {
      json = JSON.parse(text);
    } catch {
      throw new SyncPayloadError('Sync file is not valid JSON.');
    }

    const result = envelopeSchema.safeParse(json);
    if (!result.success) {
      throw new SyncPayloadError('Sync file has an invalid structure.');
    }

    if (result.data.protocolVersion !== SYNC_PROTOCOL_VERSION) {
      throw new SyncVersionError('Unsupported sync protocol version.');
    }

    const { checksum, ...payload } = result.data;
    const expected = await this.checksum(payload);

    if (expected.toLowerCase() !== checksum.toLowerCase()) {
      throw new SyncChecksumError();
    }

    return result.data;
  }
}
