export type SyncSendResult = {
  fileName: string;
  size: number;
};

export type SyncReceiveResult = {
  content: string;
  fileName: string;
};

export const SYNC_TRANSPORT = 'SyncTransport';

export interface SyncTransport {
  send(content: string, fileName: string): Promise<SyncSendResult>;
  receive(): Promise<SyncReceiveResult | null>;
}
