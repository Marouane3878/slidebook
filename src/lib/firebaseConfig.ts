import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingConfiguration = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigurationError = missingConfiguration.length
  ? 'Firebase is not configured yet. Add the EXPO_PUBLIC_FIREBASE_* values to .env.local and restart Expo.'
  : null;

/**
 * Firebase web configuration identifies the public Firebase project; it is
 * bundled into client apps by design. Admin SDK credentials and service-account
 * keys must never be imported here or stored in EXPO_PUBLIC_* variables.
 */
export function getFirebaseApp(): FirebaseApp {
  if (firebaseConfigurationError) {
    throw new Error(firebaseConfigurationError);
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
