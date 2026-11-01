import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type {
  NearbyErrorCode,
  NearbyPeer,
  NearbySendEvent,
  NearbySenderSession,
} from '@/domain/entities/nearby';
import { NearbyError } from '@/domain/errors/nearby-errors';
import { SyncEmptyDataError } from '@/domain/errors/sync-errors';
import { RunNearbySendUseCase } from '@/domain/useCases/sync/run-nearby-send';
import { useInjection } from '@/hooks/use-injection';
import { useTranslation } from '@/hooks/use-translation';

const KEEP_AWAKE_TAG = 'nearby-sync-send';

export type NearbySendStatus =
  | 'idle'
  | 'starting'
  | 'waiting'
  | 'invitation'
  | 'connecting'
  | 'sending'
  | 'sent'
  | 'error';

export function useNearbySend() {
  const runSend = useInjection(RunNearbySendUseCase);
  const { t } = useTranslation();

  const [status, setStatus] = useState<NearbySendStatus>('idle');
  const [peer, setPeer] = useState<NearbyPeer | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<NearbyErrorCode | null>(null);
  const sessionRef = useRef<NearbySenderSession | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const interruptibleRef = useRef(false);

  const describeError = useCallback(
    (cause: unknown): { code: NearbyErrorCode; message: string } => {
      if (cause instanceof NearbyError) {
        return {
          code: cause.code,
          message: t(`sync.nearby.errors.${cause.code}`),
        };
      }

      if (cause instanceof SyncEmptyDataError) {
        return {
          code: 'empty',
          message: t('sync.nearby.errors.empty'),
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
    (event: NearbySendEvent) => {
      switch (event.type) {
        case 'waiting':
          setStatus('waiting');
          break;
        case 'invitation':
          setPeer(event.peer);
          setStatus('invitation');
          break;
        case 'connecting':
          setPeer(event.peer);
          setStatus('connecting');
          break;
        case 'sending':
          setStatus('sending');
          setProgress(event.progress);
          break;
        case 'sent':
          setProgress(1);
          setStatus('sent');
          break;
        case 'error':
          setError(t(`sync.nearby.errors.${event.code}`));
          setErrorCode(event.code);
          setStatus('error');
          break;
      }
    },
    [t],
  );

  const start = useCallback(
    async (deviceName: string) => {
      if (sessionRef.current) {
        await sessionRef.current.cancel();
        sessionRef.current = null;
      }

      const attempt = attemptRef.current + 1;
      attemptRef.current = attempt;
      const emit = (event: NearbySendEvent) => {
        if (attemptRef.current === attempt && mountedRef.current) {
          handleEvent(event);
        }
      };

      setPeer(null);
      setProgress(0);
      setError(null);
      setErrorCode(null);
      setStatus('starting');

      try {
        const session = await runSend.execute({
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
    [describeError, handleEvent, runSend],
  );

  const accept = useCallback(async () => {
    await sessionRef.current?.accept();
  }, []);

  const reject = useCallback(async () => {
    await sessionRef.current?.reject();
  }, []);

  const cancel = useCallback(async () => {
    attemptRef.current += 1;
    await sessionRef.current?.cancel();
    sessionRef.current = null;
    setPeer(null);
    setProgress(0);
    setStatus('idle');
  }, []);

  const reset = useCallback(() => {
    setPeer(null);
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
    status === 'waiting' ||
    status === 'invitation' ||
    status === 'connecting' ||
    status === 'sending';

  // Permission dialogs also background the activity on Android, so the
  // "starting" phase must not abort the session.
  const interruptible = active && status !== 'starting';

  useEffect(() => {
    interruptibleRef.current = interruptible;
  }, [interruptible]);

  // Nearby Connections cannot keep running reliably while the app is in the
  // background, so stop with a clear message instead of corrupting the session.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'background' || !interruptibleRef.current) {
        return;
      }

      attemptRef.current += 1;
      void sessionRef.current?.cancel();
      sessionRef.current = null;
      setPeer(null);
      setProgress(0);
      setStatus('error');
      setErrorCode('background');
      setError(t('sync.nearby.errors.background'));
    });

    return () => subscription.remove();
  }, [t]);

  useEffect(() => {
    if (!active) {
      return;
    }

    void activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [active]);

  return {
    status,
    peer,
    progress,
    error,
    errorCode,
    active,
    start,
    accept,
    reject,
    cancel,
    reset,
  };
}
