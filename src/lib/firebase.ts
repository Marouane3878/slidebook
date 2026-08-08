import { getAuth, type Auth } from 'firebase/auth';

import {
  firebaseConfigurationError,
  getFirebaseApp,
} from './firebaseConfig';

let authInstance: Auth | undefined;

export { firebaseConfigurationError };

export function getFirebaseAuth(): Auth {
  authInstance ??= getAuth(getFirebaseApp());
  return authInstance;
}
