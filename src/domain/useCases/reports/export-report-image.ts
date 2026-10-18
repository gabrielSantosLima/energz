import { injectable } from 'tsyringe';

import { ReportExporter } from '@/domain/services/report-exporter';

@injectable()
export class ExportReportImageUseCase {
  constructor(private readonly exporter: ReportExporter) {}

  async execute(base64: string): Promise<void> {
    const uri = await this.exporter.persistBase64(
      base64,
      `report-${Date.now()}.png`,
    );
    if (uri) {
      await this.exporter.share(uri, 'image/png');
    }
  }
}
