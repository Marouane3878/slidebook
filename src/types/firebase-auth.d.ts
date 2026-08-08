import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

// Firebase 12's React Native runtime exports this API, but the top-level
// `firebase/auth` wrapper currently points TypeScript at its web declarations.
declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
