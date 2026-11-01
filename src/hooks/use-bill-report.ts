import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';

import type { BillReport } from '@/domain/entities/bill-report';
import { CaptureImageUseCase } from '@/domain/useCases/reports/capture-image';
import { ExportReportImageUseCase } from '@/domain/useCases/reports/export-report-image';
import { ExportReportPdfUseCase } from '@/domain/useCases/reports/export-report-pdf';
import { GenerateBillReportUseCase } from '@/domain/useCases/reports/generate-bill-report';
import { useInjection } from '@/hooks/use-injection';
import { useTranslation } from '@/hooks/use-translation';
import { buildBillReportHtml } from '@/lib/bill-report-html';

export function useBillReport() {
  const generate = useInjection(GenerateBillReportUseCase);
  const capture = useInjection(CaptureImageUseCase);
  const exportPdfUseCase = useInjection(ExportReportPdfUseCase);
  const exportImageUseCase = useInjection(ExportReportImageUseCase);
  const { t, locale } = useTranslation();

  const [report, setReport] = useState<BillReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;

    void generate.execute().then((result) => {
      if (active) {
        setReport(result);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [generate]);

  const exportPdf = useCallback(async () => {
    if (!report) {
      return;
    }

    setExporting(true);
    try {
      const html = buildBillReportHtml(
        report,
        {
          title: t('reports.billsTitle'),
          date: t('reports.date'),
          consumption: t('reports.consumption'),
          production: t('reports.production'),
          amount: t('reports.amount'),
          total: t('reports.total'),
          bills: t('reports.bills'),
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
    report,
    loading,
    exporting,
    exportPdf,
    exportImage,
  };
}
