import { File } from 'expo-file-system';
import { injectable } from 'tsyringe';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * Reads local images as base64 so they can be attached to an LLM request.
 */
@injectable()
export class ImageDataReader {
  async readBase64(uri: string): Promise<string> {
    const file = new File(uri);

    if (!file.exists) {
      throw new Error('The image is not available anymore.');
    }

    return file.base64();
  }

  mimeType(uri: string): string {
    const match = /\.([a-z0-9]+)(?:[?#]|$)/i.exec(uri);
    const extension = match?.[1]?.toLowerCase() ?? 'jpg';

    return MIME_TYPES[extension] ?? 'image/jpeg';
  }
}
