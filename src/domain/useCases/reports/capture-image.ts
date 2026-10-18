import type { RefObject } from 'react';
import type { View } from 'react-native';
import { injectable } from 'tsyringe';

import { ImageCapturer } from '@/domain/services/image-capturer';

@injectable()
export class CaptureImageUseCase {
  constructor(private readonly capturer: ImageCapturer) {}

  execute(ref: RefObject<View | null>): Promise<string> {
    return this.capturer.capture(ref);
  }
}
