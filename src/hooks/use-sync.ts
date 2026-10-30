import { useCallback, useEffect, useState } from 'react';

import type {
  SyncEnvelope,
  SyncPreview,
  SyncResult,
} from '@/domain/entities/sync';
import {
  SyncChecksumError,
  SyncEmptyDataError,
  SyncFileError,
  SyncFileTooLargeError,
  SyncPayloadError,
  SyncSharingUnavailableError,
  SyncVersionError,
} from '@/domain/errors/sync-errors';
import type { SyncSendResult } from '@/domain/services/sync/sync-transport';
import { ApplySyncUseCase } from '@/domain/useCases/sync/apply-sync';
import { ExportSyncFileUseCase } from '@/domain/useCases/sync/export-sync-file';
import { GetSyncDeviceNameUseCase } from '@/domain/useCases/sync/get-sync-device-name';
import { ImportSyncFileUseCase } from '@/domain/useCases/sync/import-sync-file';
import { PreviewSyncUseCase } from '@/domain/useCases/sync/preview-sync';
import { SetSyncDeviceNameUseCase } from '@/domain/useCases/sync/set-sync-device-name';
import { useInjection } from '@/hooks/use-injection';
import { useTranslation } from '@/hooks/use-translation';

export function useSync() {
  const getDeviceName = useInjection(GetSyncDeviceNameUseCase);
  const saveDeviceNameUseCase = useInjection(SetSyncDeviceNameUseCase);
  const exportFile = useInjection(ExportSyncFileUseCase);
  const importFile = useInjection(ImportSyncFileUseCase);
  const previewImport = useInjection(PreviewSyncUseCase);
  const applyImport = useInjection(ApplySyncUseCase);
  const { t } = useTranslation();

  const [deviceName, setDeviceName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [envelope, setEnvelope] = useState<SyncEnvelope | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getDeviceName.execute().then((name) => {
      if (active) {
        setDeviceName(name);
      }
    });

    return () => {
      active = false;
    };
  }, [getDeviceName]);

  const describeError = useCallback(
    (cause: unknown): string => {
      if (cause instanceof SyncVersionError) {
        return t('sync.errors.version');
      }
      if (cause instanceof SyncChecksumError) {
        return t('sync.errors.checksum');
      }
      if (cause instanceof SyncFileTooLargeError) {
        return t('sync.errors.tooLarge');
      }
      if (cause instanceof SyncSharingUnavailableError) {
        return t('sync.errors.share');
      }
      if (cause instanceof SyncEmptyDataError) {
        return t('sync.errors.empty');
      }
      if (cause instanceof SyncPayloadError || cause instanceof SyncFileError) {
        return t('sync.errors.invalid');
      }
      return cause instanceof Error
        ? cause.message
        : t('sync.errors.generic');
    },
    [t],
  );

  const saveDeviceName = useCallback(
    async (name: string): Promise<string> => {
      const saved = await saveDeviceNameUseCase.execute(name);
      setDeviceName(saved);
      return saved;
    },
    [saveDeviceNameUseCase],
  );

  const exportData = useCallback(async (): Promise<SyncSendResult | null> => {
    setError(null);
    setExporting(true);
    try {
      await saveDeviceName(deviceName);
      return await exportFile.execute();
    } catch (cause) {
      setError(describeError(cause));
      return null;
    } finally {
      setExporting(false);
    }
  }, [describeError, deviceName, exportFile, saveDeviceName]);

  const pickFile = useCallback(async (): Promise<void> => {
    setError(null);
    setResult(null);
    setPreview(null);
    setEnvelope(null);
    setSourceFileName(null);
    setImporting(true);

    try {
      const imported = await importFile.execute();
      if (!imported) {
        return;
      }

      const nextPreview = await previewImport.execute(imported.envelope);
      setEnvelope(imported.envelope);
      setPreview(nextPreview);
      setSourceFileName(imported.fileName);
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setImporting(false);
    }
  }, [describeError, importFile, previewImport]);

  const apply = useCallback(async (): Promise<SyncResult | null> => {
    if (!envelope) {
      return null;
    }

    setError(null);
    setApplying(true);
    try {
      const applied = await applyImport.execute(envelope);
      setResult(applied);
      setPreview(null);
      setEnvelope(null);
      return applied;
    } catch (cause) {
      setError(describeError(cause));
      return null;
    } finally {
      setApplying(false);
    }
  }, [applyImport, describeError, envelope]);

  const cancelPreview = useCallback(() => {
    setPreview(null);
    setEnvelope(null);
    setSourceFileName(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setEnvelope(null);
    setSourceFileName(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    deviceName,
    setDeviceName,
    exporting,
    importing,
    applying,
    preview,
    result,
    sourceFileName,
    error,
    exportData,
    pickFile,
    apply,
    cancelPreview,
    reset,
    clearError: () => setError(null),
  };
}
