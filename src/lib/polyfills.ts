import * as ExpoCrypto from 'expo-crypto';

type GlobalWithShims = {
  window?: unknown;
  process?: { env?: Record<string, string | undefined> };
  crypto?: CryptoLike;
};

type CryptoLike = {
  getRandomValues?: (
    array: Parameters<typeof ExpoCrypto.getRandomValues>[0],
  ) => Parameters<typeof ExpoCrypto.getRandomValues>[0];
  randomUUID?: () => string;
};

const globalWithShims = globalThis as unknown as GlobalWithShims;

if (!globalWithShims.window) {
  globalWithShims.window = globalThis;
}

if (!globalWithShims.process) {
  globalWithShims.process = { env: {} };
} else if (!globalWithShims.process.env) {
  globalWithShims.process.env = {};
}

const cryptoObject: CryptoLike = globalWithShims.crypto ?? {};

if (typeof cryptoObject.getRandomValues !== 'function') {
  cryptoObject.getRandomValues = (array) =>
    ExpoCrypto.getRandomValues(array);
}

if (typeof cryptoObject.randomUUID !== 'function') {
  cryptoObject.randomUUID = () => ExpoCrypto.randomUUID();
}

globalWithShims.crypto = cryptoObject;
