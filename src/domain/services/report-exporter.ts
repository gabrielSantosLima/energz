import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { injectable } from 'tsyringe';

@injectable()
export class ReportExporter {
  async toPdf(html: string): Promise<string> {
    const { uri, base64 } = await Print.printToFileAsync({
      html,
      base64: true,
    });
    if (!base64) {
      return uri;
    }
    return this.persistBase64(base64, `report-${Date.now()}.pdf`);
  }

  async persistBase64(base64: string, filename: string): Promise<string> {
    const base = FileSystem.documentDirectory;
    if (!base) {
      return '';
    }
    const destination = `${base}${filename}`;
    await FileSystem.writeAsStringAsync(destination, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return destination;
  }

  async share(uri: string, mimeType?: string): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) {
      return;
    }
    await Sharing.shareAsync(uri, { mimeType });
  }
}
