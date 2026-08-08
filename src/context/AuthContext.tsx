import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  firebaseConfigurationError,
  getFirebaseAuth,
} from '../lib/firebase';
import { ensureUserRecords } from '../lib/database';

export interface AuthContextValue {
  configurationError: string | null;
  isLoading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment, then try again.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this Firebase project.';
    default:
      return 'We could not complete that request. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configurationError, setConfigurationError] = useState<string | null>(
    firebaseConfigurationError,
  );

  useEffect(() => {
    if (firebaseConfigurationError) {
      setIsLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(
        getFirebaseAuth(),
        (nextUser) => {
          setUser(nextUser);
          setIsLoading(false);
          if (nextUser) {
            void ensureUserRecords(nextUser).catch(() => {
              // Library subscriptions surface database setup/permission errors.
            });
          }
        },
        (error) => {
          setConfigurationError(getAuthErrorMessage(error));
          setIsLoading(false);
        },
      );

      return unsubscribe;
    } catch (error) {
      setConfigurationError(getAuthErrorMessage(error));
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    return credential.user;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );
      await updateProfile(credential.user, { displayName: displayName.trim() });
      void ensureUserRecords(credential.user).catch(() => {
        // Library subscriptions surface database setup/permission errors.
      });
      return credential.user;
    },
    [],
  );

  const signOut = useCallback(
    () => firebaseSignOut(getFirebaseAuth()),
    [],
  );

  const sendPasswordReset = useCallback(
    (email: string) =>
      sendPasswordResetEmail(getFirebaseAuth(), email.trim()),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configurationError,
      isLoading,
      user,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
    }),
    [
      configurationError,
      isLoading,
      sendPasswordReset,
      signIn,
      signOut,
      signUp,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
