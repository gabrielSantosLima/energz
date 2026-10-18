import * as Crypto from 'expo-crypto';
import { injectable } from 'tsyringe';

@injectable()
export class IdGenerator {
  generate(): string {
    return Crypto.randomUUID();
  }
}
