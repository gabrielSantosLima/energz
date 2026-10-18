import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';

import type { Report } from '@/domain/entities/report';
import { CaptureImageUseCase } from '@/domain/useCases/reports/capture-image';
import { ExportReportImageUseCase } from '@/domain/useCases/reports/export-report-image';
import { ExportReportPdfUseCase } from '@/domain/useCases/reports/export-report-pdf';
import { GenerateReportUseCase } from '@/domain/useCases/reports/generate-report';
import { useCycles } from '@/hooks/use-cycles';
import { useInjection } from '@/hooks/use-injection';
import { useTranslation } from '@/hooks/use-translation';
import { buildReportHtml } from '@/lib/report-html';

export function useReport() {
  const generate = useInjection(GenerateReportUseCase);
  const capture = useInjection(CaptureImageUseCase);
  const exportPdfUseCase = useInjection(ExportReportPdfUseCase);
  const exportImageUseCase = useInjection(ExportReportImageUseCase);
  const { cycles } = useCycles();
  const { t, locale } = useTranslation();

  const [cycleId, setCycleId] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const currentCycle =
    cycles.find((cycle) => !cycle.closed) ?? cycles[cycles.length - 1] ?? null;
  const effectiveCycleId = cycleId ?? currentCycle?.id ?? null;

  useEffect(() => {
    let active = true;

    void generate.execute(effectiveCycleId ?? undefined).then((result) => {
      if (active) {
        setReport(result);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [generate, effectiveCycleId]);

  const exportPdf = useCallback(async () => {
    if (!report) {
      return;
    }
    setExporting(true);
    try {
      const html = buildReportHtml(
        report,
        {
          title: t('reports.title'),
          period: t('reports.period'),
          production: t('reports.production'),
          consumption: t('reports.consumption'),
          balance: t('reports.balance'),
          date: t('reports.date'),
          measurements: t('reports.measurements'),
        },
        locale,
      );
      await exportPdfUseCase.execute(html);
    } finally {
      setExporting(false);
    }
  }, [report, exportPdfUseCase, t, locale]);

  const exportImage = useCallback(
    async (chartRef: RefObject<View | null>) => {
      if (!report) {
        return;
      }
      setExporting(true);
      try {
        const base64 = await capture.execute(chartRef);
        await exportImageUseCase.execute(base64);
      } finally {
        setExporting(false);
      }
    },
    [report, capture, exportImageUseCase],
  );

  return {
    cycles,
    cycleId: effectiveCycleId,
    setCycleId,
    report,
    loading,
    exporting,
    exportPdf,
    exportImage,
  };
}
