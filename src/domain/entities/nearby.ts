import type { SyncEnvelope } from './sync';

export const NEARBY_CHUNK_SIZE = 8000;
export const NEARBY_ACK_TIMEOUT_MS = 10000;
export const NEARBY_MAX_RETRIES = 3;
export const NEARBY_CONNECT_TIMEOUT_MS = 45000;
export const NEARBY_IDLE_TIMEOUT_MS = 60000;

export type NearbyPeer = {
  id: string;
  name: string;
};

export const NEARBY_ERROR_CODES = [
  'permission',
  'permissionBlocked',
  'location',
  'bluetooth',
  'unavailable',
  'connection',
  'peerLost',
  'background',
  'transfer',
  'timeout',
  'tooLarge',
  'invalid',
  'canceled',
  'empty',
] as const;

export type NearbyErrorCode = (typeof NEARBY_ERROR_CODES)[number];

export type NearbyFrame =
  | {
      type: 'begin';
      sessionId: string;
      totalChunks: number;
      checksum: string;
      protocolVersion: number;
      schemaVersion: number;
    }
  | { type: 'chunk'; sessionId: string; index: number; data: string }
  | { type: 'end'; sessionId: string }
  | { type: 'ack'; sessionId: string; index: number }
  | { type: 'complete'; sessionId: string }
  | {
      type: 'error';
      sessionId: string;
      message: string;
      code?: NearbyErrorCode;
    };

export type NearbySendEvent =
  | { type: 'waiting' }
  | { type: 'invitation'; peer: NearbyPeer }
  | { type: 'connecting'; peer: NearbyPeer }
  | { type: 'sending'; progress: number }
  | { type: 'sent' }
  | { type: 'error'; code: NearbyErrorCode; message: string };

export type NearbyReceiveEvent =
  | { type: 'discovering' }
  | { type: 'peer-found'; peer: NearbyPeer }
  | { type: 'peer-lost'; peerId: string }
  | { type: 'connecting'; peer: NearbyPeer }
  | { type: 'receiving'; progress: number }
  | {
      type: 'received';
      envelope: SyncEnvelope;
      fileName: string;
    }
  | { type: 'error'; code: NearbyErrorCode; message: string };

export interface NearbySenderSession {
  accept(): Promise<void>;
  reject(): Promise<void>;
  cancel(): Promise<void>;
}

export interface NearbyReceiverSession {
  connect(peerId: string): Promise<void>;
  cancel(): Promise<void>;
}
