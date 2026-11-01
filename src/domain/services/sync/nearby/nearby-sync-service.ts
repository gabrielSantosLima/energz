import { Platform } from 'react-native';
import { injectable } from 'tsyringe';

import {
  NEARBY_ACK_TIMEOUT_MS,
  NEARBY_CHUNK_SIZE,
  NEARBY_CONNECT_TIMEOUT_MS,
  NEARBY_ERROR_CODES,
  NEARBY_IDLE_TIMEOUT_MS,
  NEARBY_MAX_RETRIES,
  type NearbyErrorCode,
  type NearbyFrame,
  type NearbyPeer,
  type NearbyReceiverSession,
  type NearbySenderSession,
} from '@/domain/entities/nearby';
import { SYNC_MAX_BYTES } from '@/domain/entities/sync';
import {
  NearbyError,
  NearbyUnavailableError,
  toNearbyError,
} from '@/domain/errors/nearby-errors';
import { IdGenerator } from '@/domain/services/id-generator';
import { NearbyPermissions } from '@/domain/services/sync/nearby/nearby-permissions';

type NearbyApi = typeof import('expo-nearby-connections');

type Timer = ReturnType<typeof setTimeout>;

type SenderHandlers = {
  onWaiting: () => void;
  onInvitation: (peer: NearbyPeer) => void;
  onConnecting: (peer: NearbyPeer) => void;
  onProgress: (progress: number) => void;
  onSent: () => void;
  onError: (code: NearbyErrorCode, message: string) => void;
};

type ReceiverHandlers = {
  onDiscovering: () => void;
  onPeerFound: (peer: NearbyPeer) => void;
  onPeerLost: (peerId: string) => void;
  onConnecting: (peer: NearbyPeer) => void;
  onProgress: (progress: number) => void;
  onReceived: (content: string) => void;
  onError: (code: NearbyErrorCode, message: string) => void;
};

export type NearbySenderConfig = {
  deviceName: string;
  sessionId: string;
  content: string;
  checksum: string;
  protocolVersion: number;
  schemaVersion: number;
  handlers: SenderHandlers;
};

export type NearbyReceiverConfig = {
  deviceName: string;
  handlers: ReceiverHandlers;
};

type AckWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: Timer;
};

function parseFrame(text: string): NearbyFrame | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as { type?: unknown }).type !== 'string'
    ) {
      return null;
    }

    const frame = parsed as NearbyFrame;

    if (
      frame.type === 'error' &&
      frame.code !== undefined &&
      !(NEARBY_ERROR_CODES as readonly string[]).includes(frame.code)
    ) {
      return { ...frame, code: undefined };
    }

    return frame;
  } catch {
    return null;
  }
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

class NearbySessionBase {
  protected canceled = false;

  constructor(protected readonly nearby: NearbyApi) {}
  protected unsubscribers: (() => void)[] = [];
  protected timers = new Set<Timer>();

  protected addTimer(callback: () => void, delay: number): Timer {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  protected clearTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  protected unsubscribeAll(): void {
    for (const unsubscribe of this.unsubscribers) {
      try {
        unsubscribe();
      } catch {
        // Ignore listeners already removed by the native module.
      }
    }
    this.unsubscribers = [];
  }

  protected async sendErrorFrame(
    peerId: string | null,
    sessionId: string | null,
    code: NearbyErrorCode,
    message: string,
  ): Promise<void> {
    if (!peerId || !sessionId) {
      return;
    }

    try {
      await this.nearby.sendText(
        peerId,
        JSON.stringify({
          type: 'error',
          sessionId,
          message,
          code,
        } satisfies NearbyFrame),
      );
    } catch {
      // The peer may already be gone; the local failure is what matters.
    }
  }

  protected async cleanup(): Promise<void> {
    this.unsubscribeAll();
    this.clearTimers();
    await Promise.allSettled([
      this.nearby.stopAdvertise(),
      this.nearby.stopDiscovery(),
      this.nearby.disconnect(),
    ]);
  }
}

class NearbySenderSessionImpl
  extends NearbySessionBase
  implements NearbySenderSession
{
  private peer: NearbyPeer | null = null;
  private sending = false;
  private finished = false;
  private connected = false;
  private advertising = true;
  private resuming = false;
  private ackWaiters = new Map<number, AckWaiter>();
  private completeWaiter: {
    resolve: () => void;
    reject: (error: Error) => void;
  } | null = null;

  constructor(
    private readonly config: NearbySenderConfig,
    nearby: NearbyApi,
  ) {
    super(nearby);
  }

  async start(): Promise<void> {
    try {
      await this.nearby.startAdvertise(
        this.config.deviceName,
        this.nearby.Strategy.P2P_POINT_TO_POINT,
      );
    } catch (cause) {
      throw toNearbyError(cause);
    }

    this.unsubscribers.push(
      this.nearby.onInvitationReceived(({ peerId, name }) => {
        if (this.canceled || this.finished) {
          return;
        }

        if (this.peer) {
          void this.nearby.rejectConnection(peerId).catch(() => undefined);
          return;
        }

        this.peer = { id: peerId, name };
        this.config.handlers.onInvitation(this.peer);
      }),
      this.nearby.onConnected(({ peerId }) => {
        if (!this.peer || peerId !== this.peer.id || this.canceled) {
          return;
        }
        this.connected = true;
        void this.transfer();
      }),
      this.nearby.onDisconnected(({ peerId }) => {
        if (this.peer?.id !== peerId || this.finished || this.canceled) {
          return;
        }

        // Losing the peer before any data was sent is not a failure: go back
        // to waiting so another device can connect without restarting.
        if (!this.connected && !this.sending) {
          this.peer = null;
          if (!this.advertising) {
            void this.resumeAdvertising();
          }
          this.config.handlers.onWaiting();
          return;
        }

        this.fail('peerLost', 'The other device disconnected.');
      }),
      this.nearby.onTextReceived(({ peerId, text }) => {
        if (this.peer?.id !== peerId) {
          return;
        }
        this.handleText(text);
      }),
    );

    this.config.handlers.onWaiting();
  }

  async accept(): Promise<void> {
    const peer = this.peer;
    if (!peer || this.canceled) {
      return;
    }

    this.config.handlers.onConnecting(peer);

    try {
      await this.nearby.acceptConnection(peer.id);
      await this.nearby.stopAdvertise().catch(() => undefined);
      this.advertising = false;
      this.addTimer(() => {
        // The peer may have gone back to "waiting" after a drop, in which case
        // this connection attempt is already over.
        if (this.peer?.id !== peer.id || this.connected || this.finished) {
          return;
        }
        this.fail('timeout', 'Connection timed out.');
      }, NEARBY_CONNECT_TIMEOUT_MS);
    } catch (cause) {
      const error = toNearbyError(cause);
      this.fail(error.code, error.message);
    }
  }

  async reject(): Promise<void> {
    const peer = this.peer;
    if (!peer) {
      return;
    }

    this.peer = null;
    await this.nearby.rejectConnection(peer.id).catch(() => undefined);
    if (!this.canceled) {
      this.config.handlers.onWaiting();
    }
  }

  async cancel(): Promise<void> {
    if (this.canceled) {
      return;
    }

    this.canceled = true;
    this.rejectWaiters(new Error('Sync canceled.'));

    if (this.connected) {
      await this.sendErrorFrame(
        this.peer?.id ?? null,
        this.config.sessionId,
        'canceled',
        'The other device stopped the transfer.',
      );
    }

    await this.cleanup();
  }

  private async resumeAdvertising(): Promise<void> {
    if (this.advertising || this.canceled || this.resuming) {
      return;
    }

    this.resuming = true;

    try {
      await this.nearby.startAdvertise(
        this.config.deviceName,
        this.nearby.Strategy.P2P_POINT_TO_POINT,
      );
      this.advertising = true;
    } catch (cause) {
      const error = toNearbyError(cause);
      this.fail(error.code, error.message);
    } finally {
      this.resuming = false;
    }
  }

  private splitChunks(): string[] {
    const content = this.config.content;
    const chunks: string[] = [];
    let index = 0;

    while (index < content.length) {
      let end = Math.min(index + NEARBY_CHUNK_SIZE, content.length);
      const codeUnit = content.charCodeAt(end - 1);

      // Do not cut a surrogate pair in half.
      if (end < content.length && codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
        end -= 1;
      }

      chunks.push(content.slice(index, end));
      index = end;
    }

    return chunks.length > 0 ? chunks : [''];
  }

  private async transfer(): Promise<void> {
    const peer = this.peer;
    if (!peer || this.sending || this.canceled) {
      return;
    }

    this.sending = true;
    const sessionId = this.config.sessionId;
    const chunks = this.splitChunks();

    try {
      await this.nearby.sendText(
        peer.id,
        JSON.stringify({
          type: 'begin',
          sessionId,
          totalChunks: chunks.length,
          checksum: this.config.checksum,
          protocolVersion: this.config.protocolVersion,
          schemaVersion: this.config.schemaVersion,
        } satisfies NearbyFrame),
      );

      for (let index = 0; index < chunks.length; index += 1) {
        await this.sendChunk(peer.id, sessionId, index, chunks[index]);
        this.config.handlers.onProgress((index + 1) / chunks.length);
      }

      await this.nearby.sendText(
        peer.id,
        JSON.stringify({ type: 'end', sessionId } satisfies NearbyFrame),
      );

      await this.waitForComplete();

      this.finished = true;
      this.config.handlers.onSent();
      await this.cleanup();
    } catch (cause) {
      this.fail(
        cause instanceof NearbyError ? cause.code : 'transfer',
        errorMessage(cause),
      );
    }
  }

  private sendChunk(
    peerId: string,
    sessionId: string,
    index: number,
    data: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempt = 0;

      const retryOrFail = (cause: unknown) => {
        attempt += 1;

        if (this.canceled) {
          reject(new Error('Sync canceled.'));
          return;
        }

        if (attempt >= NEARBY_MAX_RETRIES) {
          reject(
            new NearbyError('timeout', errorMessage(cause)),
          );
          return;
        }

        send();
      };

      const send = () => {
        const timer = this.addTimer(() => {
          this.ackWaiters.delete(index);
          retryOrFail(new Error('Chunk acknowledgment timed out.'));
        }, NEARBY_ACK_TIMEOUT_MS);

        this.ackWaiters.set(index, {
          resolve: () => {
            clearTimeout(timer);
            this.timers.delete(timer);
            this.ackWaiters.delete(index);
            resolve();
          },
          reject: (error) => {
            clearTimeout(timer);
            this.timers.delete(timer);
            this.ackWaiters.delete(index);
            reject(error);
          },
          timer,
        });

        void this.nearby.sendText(
          peerId,
          JSON.stringify({
            type: 'chunk',
            sessionId,
            index,
            data,
          } satisfies NearbyFrame),
        ).catch((cause) => {
          const waiter = this.ackWaiters.get(index);
          if (waiter) {
            clearTimeout(waiter.timer);
            this.timers.delete(waiter.timer);
            this.ackWaiters.delete(index);
          }
          retryOrFail(cause);
        });
      };

      send();
    });
  }

  private waitForComplete(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = this.addTimer(() => {
        this.completeWaiter = null;
        reject(new NearbyError('timeout', 'Transfer confirmation timed out.'));
      }, NEARBY_ACK_TIMEOUT_MS);

      this.completeWaiter = {
        resolve: () => {
          clearTimeout(timer);
          this.timers.delete(timer);
          this.completeWaiter = null;
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          this.timers.delete(timer);
          this.completeWaiter = null;
          reject(error);
        },
      };
    });
  }

  private handleText(text: string): void {
    const frame = parseFrame(text);
    if (!frame) {
      return;
    }

    if (frame.type === 'ack') {
      this.ackWaiters.get(frame.index)?.resolve();
      return;
    }

    if (frame.type === 'complete') {
      this.completeWaiter?.resolve();
      return;
    }

    if (frame.type === 'error') {
      this.fail(frame.code ?? 'transfer', frame.message);
    }
  }

  private rejectWaiters(error: Error): void {
    for (const waiter of this.ackWaiters.values()) {
      waiter.reject(error);
    }
    this.ackWaiters.clear();
    this.completeWaiter?.reject(error);
    this.completeWaiter = null;
  }

  private fail(code: NearbyErrorCode, message: string): void {
    if (this.canceled || this.finished) {
      return;
    }

    this.canceled = true;
    this.rejectWaiters(new NearbyError(code, message));
    this.config.handlers.onError(code, message);
    void this.notifyAndCleanup(code, message);
  }

  private async notifyAndCleanup(
    code: NearbyErrorCode,
    message: string,
  ): Promise<void> {
    if (this.connected) {
      await this.sendErrorFrame(
        this.peer?.id ?? null,
        this.config.sessionId,
        code,
        message,
      );
    }

    await this.cleanup();
  }
}

class NearbyReceiverSessionImpl
  extends NearbySessionBase
  implements NearbyReceiverSession
{
  private peers = new Map<string, NearbyPeer>();
  private peer: NearbyPeer | null = null;
  private connected = false;
  private connecting = false;
  private sessionId: string | null = null;
  private chunks: string[] = [];
  private received = 0;
  private total = 0;
  private ended = false;
  private finalized = false;
  private restarting = false;
  private idleTimer: Timer | null = null;

  constructor(
    private readonly config: NearbyReceiverConfig,
    nearby: NearbyApi,
  ) {
    super(nearby);
  }

  async start(): Promise<void> {
    try {
      await this.nearby.startDiscovery(
        this.config.deviceName,
        this.nearby.Strategy.P2P_POINT_TO_POINT,
      );
    } catch (cause) {
      throw toNearbyError(cause);
    }

    this.unsubscribers.push(
      this.nearby.onPeerFound(({ peerId, name }) => {
        if (this.canceled) {
          return;
        }
        const peer = { id: peerId, name };
        this.peers.set(peerId, peer);
        this.config.handlers.onPeerFound(peer);
      }),
      this.nearby.onPeerLost(({ peerId }) => {
        if (this.canceled) {
          return;
        }

        this.peers.delete(peerId);
        this.config.handlers.onPeerLost(peerId);

        // If the peer we were about to connect disappears, silently go back to
        // discovery instead of waiting for the connect timeout.
        if (!this.connected && this.peer?.id === peerId) {
          void this.resumeDiscovery();
        }
      }),
      this.nearby.onConnected(({ peerId }) => {
        if (!this.peer || peerId !== this.peer.id || this.canceled) {
          return;
        }
        this.connected = true;
        this.resetIdleTimer();
        this.config.handlers.onProgress(0);
      }),
      this.nearby.onDisconnected(({ peerId }) => {
        if (!this.connected || this.peer?.id !== peerId || this.finalized) {
          return;
        }

        // Dropping the connection before any data arrived is recoverable.
        if (this.received === 0 && !this.ended) {
          void this.resumeDiscovery();
          return;
        }

        this.fail('peerLost', 'The other device disconnected.');
      }),
      this.nearby.onTextReceived(({ peerId, text }) => {
        if (this.peer?.id !== peerId) {
          return;
        }
        void this.handleText(text);
      }),
    );

    this.config.handlers.onDiscovering();
  }

  async connect(peerId: string): Promise<void> {
    if (this.canceled || this.connected || this.connecting) {
      return;
    }

    this.connecting = true;
    const peer = this.peers.get(peerId) ?? { id: peerId, name: '' };
    this.peer = peer;
    this.config.handlers.onConnecting(peer);

    try {
      await this.nearby.stopDiscovery().catch(() => undefined);
      await this.nearby.requestConnection(peerId);
      this.addTimer(() => {
        if (!this.connected && this.peer?.id === peer.id) {
          this.fail('timeout', 'Connection timed out.');
        }
      }, NEARBY_CONNECT_TIMEOUT_MS);
    } catch (cause) {
      const error = toNearbyError(cause);
      this.fail(error.code, error.message);
    }
  }

  async cancel(): Promise<void> {
    if (this.canceled) {
      return;
    }

    this.canceled = true;

    if (this.connected) {
      await this.sendErrorFrame(
        this.peer?.id ?? null,
        this.sessionId,
        'canceled',
        'The other device stopped the transfer.',
      );
    }

    await this.cleanup();
  }

  /**
   * Recoverable drop: forget the current peer and start discovering again so
   * the user can retry without leaving the screen.
   */
  private async resumeDiscovery(): Promise<void> {
    if (this.canceled || this.finalized || this.restarting) {
      return;
    }

    this.restarting = true;

    this.connected = false;
    this.connecting = false;
    this.peer = null;
    this.sessionId = null;
    this.ended = false;
    this.received = 0;
    this.total = 0;
    this.chunks = [];
    this.peers.clear();
    this.idleTimer = null;
    this.clearTimers();

    try {
      await this.nearby.disconnect().catch(() => undefined);
      await this.nearby.stopDiscovery().catch(() => undefined);
      await this.nearby.startDiscovery(
        this.config.deviceName,
        this.nearby.Strategy.P2P_POINT_TO_POINT,
      );

      if (!this.canceled) {
        this.config.handlers.onDiscovering();
      }
    } catch (cause) {
      const error = toNearbyError(cause);
      this.fail(error.code, error.message);
    } finally {
      this.restarting = false;
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.timers.delete(this.idleTimer);
    }

    this.idleTimer = this.addTimer(() => {
      this.fail('timeout', 'No data was received in time.');
    }, NEARBY_IDLE_TIMEOUT_MS);
  }

  private async handleText(text: string): Promise<void> {
    const frame = parseFrame(text);
    if (!frame || this.canceled) {
      return;
    }

    if (frame.type === 'begin') {
      if (this.sessionId && this.sessionId !== frame.sessionId) {
        return;
      }

      const maxChunks = Math.ceil(SYNC_MAX_BYTES / NEARBY_CHUNK_SIZE) + 1;
      if (
        !Number.isInteger(frame.totalChunks) ||
        frame.totalChunks < 1 ||
        frame.totalChunks > maxChunks
      ) {
        this.fail('invalid', 'The incoming payload is larger than allowed.');
        return;
      }

      this.sessionId = frame.sessionId;
      this.total = Math.max(1, frame.totalChunks);
      this.chunks = new Array<string>(this.total).fill('');
      this.received = 0;
      this.ended = false;
      this.resetIdleTimer();
      this.config.handlers.onProgress(0);
      return;
    }

    if (frame.type === 'chunk') {
      if (!this.sessionId || frame.sessionId !== this.sessionId) {
        return;
      }

      // Guard against a peer sending a single oversized chunk.
      if (
        typeof frame.data !== 'string' ||
        frame.data.length > NEARBY_CHUNK_SIZE * 2
      ) {
        this.fail('invalid', 'The incoming chunk is larger than allowed.');
        return;
      }

      if (
        frame.index >= 0 &&
        frame.index < this.total &&
        this.chunks[frame.index] === ''
      ) {
        this.chunks[frame.index] = frame.data;
        this.received += 1;
      }

      this.resetIdleTimer();
      this.config.handlers.onProgress(this.received / this.total);
      await this.nearby.sendText(
        this.peer?.id ?? '',
        JSON.stringify({
          type: 'ack',
          sessionId: this.sessionId,
          index: frame.index,
        } satisfies NearbyFrame),
      ).catch(() => undefined);

      if (this.ended && this.received >= this.total) {
        await this.finalize();
      }
      return;
    }

    if (frame.type === 'end') {
      if (!this.sessionId || frame.sessionId !== this.sessionId) {
        return;
      }
      this.ended = true;
      if (this.received >= this.total) {
        await this.finalize();
      }
      return;
    }

    if (frame.type === 'error') {
      this.fail(frame.code ?? 'transfer', frame.message);
    }
  }

  private async finalize(): Promise<void> {
    if (this.finalized || this.canceled) {
      return;
    }

    this.finalized = true;
    const content = this.chunks.join('');

    if (this.peer && this.sessionId) {
      await this.nearby.sendText(
        this.peer.id,
        JSON.stringify({
          type: 'complete',
          sessionId: this.sessionId,
        } satisfies NearbyFrame),
      ).catch(() => undefined);
    }

    this.config.handlers.onReceived(content);
    await this.cleanup();
  }

  private fail(code: NearbyErrorCode, message: string): void {
    if (this.canceled || this.finalized) {
      return;
    }

    this.canceled = true;
    this.config.handlers.onError(code, message);
    void this.notifyAndCleanup(code, message);
  }

  private async notifyAndCleanup(
    code: NearbyErrorCode,
    message: string,
  ): Promise<void> {
    if (this.connected) {
      await this.sendErrorFrame(
        this.peer?.id ?? null,
        this.sessionId,
        code,
        message,
      );
    }

    await this.cleanup();
  }
}

@injectable()
export class NearbySyncService {
  constructor(
    private readonly idGenerator: IdGenerator,
    private readonly permissions: NearbyPermissions,
  ) {}

  private async ensureAvailable(nearby: NearbyApi): Promise<void> {
    await this.permissions.ensure();

    if (Platform.OS === 'android') {
      const available = await nearby.isPlayServicesAvailable();
      if (!available) {
        throw new NearbyUnavailableError();
      }
    }
  }

  async startSender(
    config: Omit<NearbySenderConfig, 'handlers' | 'sessionId'> & {
      handlers: SenderHandlers;
    },
  ): Promise<NearbySenderSession> {
    const nearby = await import('expo-nearby-connections');
    await this.ensureAvailable(nearby);

    const session = new NearbySenderSessionImpl(
      {
        ...config,
        sessionId: this.idGenerator.generate(),
        handlers: config.handlers,
      },
      nearby,
    );

    try {
      await session.start();
      return session;
    } catch (cause) {
      await session.cancel();
      throw toNearbyError(cause);
    }
  }

  async startReceiver(
    config: NearbyReceiverConfig,
  ): Promise<NearbyReceiverSession> {
    const nearby = await import('expo-nearby-connections');
    await this.ensureAvailable(nearby);

    const session = new NearbyReceiverSessionImpl(config, nearby);

    try {
      await session.start();
      return session;
    } catch (cause) {
      await session.cancel();
      throw toNearbyError(cause);
    }
  }
}
