import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  NearbyErrorCode,
  NearbyPeer,
  NearbyReceiveEvent,
  NearbyReceiverSession,
} from '@/domain/entities/nearby';
import type { SyncEnvelope } from '@/domain/entities/sync';
import { NearbyError } from '@/domain/errors/nearby-errors';
import { RunNearbyReceiveUseCase } from '@/domain/useCases/sync/run-nearby-receive';
import { useInjection } from '@/hooks/use-injection';
import { useTranslation } from '@/hooks/use-translation';

const KEEP_AWAKE_TAG = 'nearby-sync-receive';

export type NearbyReceiveStatus =
  | 'idle'
  | 'starting'
  | 'discovering'
  | 'connecting'
  | 'receiving'
  | 'error';

type Params = {
  onReceived: (envelope: SyncEnvelope, fileName: string) => void;
};

export function useNearbyReceive({ onReceived }: Params) {
  const runReceive = useInjection(RunNearbyReceiveUseCase);
  const { t } = useTranslation();

  const [status, setStatus] = useState<NearbyReceiveStatus>('idle');
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<NearbyErrorCode | null>(null);
  const sessionRef = useRef<NearbyReceiverSession | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);

  const describeError = useCallback(
    (cause: unknown): { code: NearbyErrorCode; message: string } => {
      if (cause instanceof NearbyError) {
        return {
          code: cause.code,
          message: t(`sync.nearby.errors.${cause.code}`),
        };
      }

      return {
        code: 'connection',
        message: t('sync.nearby.errors.connection'),
      };
    },
    [t],
  );

  const handleEvent = useCallback(
    (event: NearbyReceiveEvent) => {
      switch (event.type) {
        case 'discovering':
          setStatus('discovering');
          break;
        case 'peer-found':
          setPeers((current) => {
            if (current.some((peer) => peer.id === event.peer.id)) {
              return current;
            }
            return [...current, event.peer];
          });
          break;
        case 'peer-lost':
          setPeers((current) =>
            current.filter((peer) => peer.id !== event.peerId),
          );
          break;
        case 'connecting':
          setSelectedPeer(event.peer);
          setStatus('connecting');
          break;
        case 'receiving':
          setStatus('receiving');
          setProgress(event.progress);
          break;
        case 'received':
          setProgress(1);
          setStatus('idle');
          setPeers([]);
          setSelectedPeer(null);
          sessionRef.current = null;
          onReceived(event.envelope, event.fileName);
          break;
        case 'error':
          setError(t(`sync.nearby.errors.${event.code}`));
          setErrorCode(event.code);
          setStatus('error');
          break;
      }
    },
    [onReceived, t],
  );

  const start = useCallback(
    async (deviceName: string) => {
      if (sessionRef.current) {
        await sessionRef.current.cancel();
        sessionRef.current = null;
      }

      const attempt = attemptRef.current + 1;
      attemptRef.current = attempt;
      const emit = (event: NearbyReceiveEvent) => {
        if (attemptRef.current === attempt && mountedRef.current) {
          handleEvent(event);
        }
      };

      setPeers([]);
      setSelectedPeer(null);
      setProgress(0);
      setError(null);
      setErrorCode(null);
      setStatus('starting');

      try {
        const session = await runReceive.execute({
          deviceName,
          onEvent: emit,
        });

        if (attemptRef.current !== attempt || !mountedRef.current) {
          await session.cancel();
          return;
        }

        sessionRef.current = session;
      } catch (cause) {
        if (attemptRef.current !== attempt || !mountedRef.current) {
          return;
        }

        const next = describeError(cause);
        setError(next.message);
        setErrorCode(next.code);
        setStatus('error');
      }
    },
    [describeError, handleEvent, runReceive],
  );

  const connect = useCallback(
    async (peerId: string) => {
      const peer = peers.find((item) => item.id === peerId) ?? null;
      if (peer) {
        setSelectedPeer(peer);
      }
      await sessionRef.current?.connect(peerId);
    },
    [peers],
  );

  const cancel = useCallback(async () => {
    attemptRef.current += 1;
    await sessionRef.current?.cancel();
    sessionRef.current = null;
    setPeers([]);
    setSelectedPeer(null);
    setProgress(0);
    setStatus('idle');
  }, []);

  const reset = useCallback(() => {
    setPeers([]);
    setSelectedPeer(null);
    setProgress(0);
    setError(null);
    setErrorCode(null);
    setStatus('idle');
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      void sessionRef.current?.cancel();
    };
  }, []);

  const active =
    status === 'starting' ||
    status === 'discovering' ||
    status === 'connecting' ||
    status === 'receiving';

  useEffect(() => {
    if (!active) {
      return;
    }

    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [active]);

  return {
    status,
    peers,
    selectedPeer,
    progress,
    error,
    errorCode,
    active,
    start,
    connect,
    cancel,
    reset,
  };
}
