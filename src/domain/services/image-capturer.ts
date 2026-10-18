import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { injectable } from 'tsyringe';

@injectable()
export class ImageCapturer {
  async capture(ref: RefObject<View | null>): Promise<string> {
    return captureRef(ref, { format: 'png', result: 'base64' });
  }
}
