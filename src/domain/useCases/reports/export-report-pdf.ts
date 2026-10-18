import { injectable } from 'tsyringe';

import { ReportExporter } from '@/domain/services/report-exporter';

@injectable()
export class ExportReportPdfUseCase {
  constructor(private readonly exporter: ReportExporter) {}

  async execute(html: string): Promise<void> {
    const uri = await this.exporter.toPdf(html);
    await this.exporter.share(uri, 'application/pdf');
  }
}
