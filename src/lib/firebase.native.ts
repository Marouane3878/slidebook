import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

import {
  firebaseConfigurationError,
  getFirebaseApp,
} from './firebaseConfig';

let authInstance: Auth | undefined;

export { firebaseConfigurationError };

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const app = getFirebaseApp();

  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh can evaluate this module after Auth is already initialized.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      authInstance = getAuth(app);
    } else {
      throw error;
    }
  }

  return authInstance;
}
