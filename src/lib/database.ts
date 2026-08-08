import { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

import type { GenreId } from '../data/books';
import {
  COLLECTIONS,
  type SaveableBook,
  type SavedBookDocument,
  type UserInterestsDocument,
} from '../types/database';
import { getFirebaseApp } from './firebaseConfig';

let databaseInstance: Firestore | undefined;

export function getFirebaseDatabase(): Firestore {
  databaseInstance ??= getFirestore(getFirebaseApp());
  return databaseInstance;
}

export function getDatabaseErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error
      ? error.message
      : 'Your library could not be updated. Please try again.';
  }

  switch (error.code) {
    case 'permission-denied':
      return 'Your database permissions need to be updated before this can be saved.';
    case 'unavailable':
      return 'The database is temporarily unavailable. Check your connection and try again.';
    case 'failed-precondition':
      return 'Cloud Firestore is not ready for this project yet.';
    default:
      return 'Your library could not be updated. Please try again.';
  }
}

/**
 * Creates the private user record and lightweight profile on first sign-in,
 * then keeps Firebase Auth profile fields in sync on later sessions.
 */
export async function ensureUserRecords(user: User): Promise<void> {
  const database = getFirebaseDatabase();
  const userReference = doc(database, COLLECTIONS.users, user.uid);
  const profileReference = doc(database, COLLECTIONS.profiles, user.uid);

  await runTransaction(database, async (transaction) => {
    // Firestore transactions require all reads before any writes.
    const [userSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(userReference),
      transaction.get(profileReference),
    ]);
    const accountFields = {
      email: user.email ?? '',
      displayName: user.displayName?.trim() ?? '',
      photoUrl: user.photoURL ?? '',
    };

    if (userSnapshot.exists()) {
      const currentUser = userSnapshot.data();
      const accountChanged =
        currentUser.email !== accountFields.email ||
        currentUser.displayName !== accountFields.displayName ||
        currentUser.photoUrl !== accountFields.photoUrl;

      if (accountChanged) {
        transaction.update(userReference, accountFields);
      }
    } else {
      transaction.set(userReference, {
        id: user.uid,
        ...accountFields,
        createdAt: serverTimestamp(),
        isPremium: false,
      });
    }

    if (profileSnapshot.exists()) {
      const currentProfile = profileSnapshot.data();
      const profileChanged =
        currentProfile.displayName !== accountFields.displayName ||
        currentProfile.photoUrl !== accountFields.photoUrl;

      if (profileChanged) {
        transaction.update(profileReference, {
          displayName: accountFields.displayName,
          photoUrl: accountFields.photoUrl,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      transaction.set(profileReference, {
        userId: user.uid,
        displayName: accountFields.displayName,
        photoUrl: accountFields.photoUrl,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export function subscribeToUserInterests(
  userId: string,
  onInterests: (interests: GenreId[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const reference = doc(
    getFirebaseDatabase(),
    COLLECTIONS.userInterests,
    userId,
  );

  return onSnapshot(
    reference,
    (snapshot) => {
      const data = snapshot.data() as UserInterestsDocument | undefined;
      onInterests(data?.interests ?? []);
    },
    onError,
  );
}

export async function saveUserInterests(
  userId: string,
  interests: GenreId[],
): Promise<void> {
  const reference = doc(
    getFirebaseDatabase(),
    COLLECTIONS.userInterests,
    userId,
  );

  await setDoc(reference, { userId, interests });
}

export function subscribeToSavedBooks(
  userId: string,
  onBooks: (books: SavedBookDocument[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const booksQuery = query(
    collection(getFirebaseDatabase(), COLLECTIONS.savedBooks),
    where('userId', '==', userId),
  );

  return onSnapshot(
    booksQuery,
    (snapshot) => {
      onBooks(
        snapshot.docs.map((bookDocument) =>
          bookDocument.data() as SavedBookDocument,
        ),
      );
    },
    onError,
  );
}

function savedBookDocumentId(userId: string, googleBookId: string): string {
  return `${userId}_${encodeURIComponent(googleBookId)}`;
}

export async function saveBookForUser(
  userId: string,
  book: SaveableBook,
): Promise<void> {
  const googleBookId = book.googleBookId;
  const reference = doc(
    getFirebaseDatabase(),
    COLLECTIONS.savedBooks,
    savedBookDocumentId(userId, googleBookId),
  );

  await setDoc(reference, {
    userId,
    googleBookId,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    savedAt: serverTimestamp(),
  });
}

export async function removeBookForUser(
  userId: string,
  googleBookId: string,
): Promise<void> {
  const reference = doc(
    getFirebaseDatabase(),
    COLLECTIONS.savedBooks,
    savedBookDocumentId(userId, googleBookId),
  );
  await deleteDoc(reference);
}
