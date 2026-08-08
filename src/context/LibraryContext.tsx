import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import type { GenreId } from '../data/books';
import {
  getDatabaseErrorMessage,
  removeBookForUser,
  saveBookForUser,
  saveUserInterests,
  subscribeToSavedBooks,
  subscribeToUserInterests,
} from '../lib/database';
import type { SaveableBook, SavedBookDocument } from '../types/database';
import { useAuth } from './AuthContext';

export interface LibraryContextValue {
  displayName: string;
  setDisplayName: Dispatch<SetStateAction<string>>;
  selectedInterests: GenreId[];
  toggleInterest: (interestId: GenreId) => void;
  savedIds: string[];
  toggleSaved: (book: SaveableBook) => void;
  isSaved: (bookId: string) => boolean;
  savedBooks: SavedBookDocument[];
  isLibraryLoading: boolean;
  libraryError: string;
  clearLibraryError: () => void;
  resetLibrary: () => void;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export interface LibraryProviderProps {
  children: ReactNode;
}

export function LibraryProvider({ children }: LibraryProviderProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('Reader');
  const [selectedInterests, setSelectedInterests] = useState<GenreId[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedBookDocuments, setSavedBookDocuments] = useState<
    SavedBookDocument[]
  >([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const interestsRef = useRef<GenreId[]>([]);
  const savedIdsRef = useRef<string[]>([]);
  const interestMutationVersion = useRef(0);
  const savedMutationVersions = useRef(new Map<string, number>());

  useEffect(() => {
    interestsRef.current = selectedInterests;
  }, [selectedInterests]);

  useEffect(() => {
    savedIdsRef.current = savedIds;
  }, [savedIds]);

  useEffect(() => {
    if (!user) {
      interestsRef.current = [];
      savedIdsRef.current = [];
      savedMutationVersions.current.clear();
      setSelectedInterests([]);
      setSavedIds([]);
      setSavedBookDocuments([]);
      setIsLibraryLoading(false);
      setLibraryError('');
      return;
    }

    setIsLibraryLoading(true);
    setLibraryError('');
    let interestsLoaded = false;
    let savedBooksLoaded = false;

    const finishInitialLoad = () => {
      if (interestsLoaded && savedBooksLoaded) {
        setIsLibraryLoading(false);
      }
    };

    const handleError = (error: unknown) => {
      setLibraryError(getDatabaseErrorMessage(error));
      setIsLibraryLoading(false);
    };

    const unsubscribeInterests = subscribeToUserInterests(
      user.uid,
      (interests) => {
        interestsRef.current = interests;
        setSelectedInterests(interests);
        interestsLoaded = true;
        finishInitialLoad();
      },
      handleError,
    );
    const unsubscribeSavedBooks = subscribeToSavedBooks(
      user.uid,
      (books) => {
        const nextSavedIds = books.map((book) => book.googleBookId);
        savedIdsRef.current = nextSavedIds;
        setSavedIds(nextSavedIds);
        setSavedBookDocuments(books);
        savedBooksLoaded = true;
        finishInitialLoad();
      },
      handleError,
    );

    return () => {
      unsubscribeInterests();
      unsubscribeSavedBooks();
    };
  }, [user]);

  const toggleInterest = useCallback(
    (interestId: GenreId) => {
      if (!user) {
        return;
      }

      const previous = interestsRef.current;
      const next = previous.includes(interestId)
        ? previous.filter((id) => id !== interestId)
        : [...previous, interestId];
      const mutationVersion = ++interestMutationVersion.current;

      interestsRef.current = next;
      setSelectedInterests(next);
      setLibraryError('');

      void saveUserInterests(user.uid, next).catch((error) => {
        if (interestMutationVersion.current === mutationVersion) {
          interestsRef.current = previous;
          setSelectedInterests(previous);
        }
        setLibraryError(getDatabaseErrorMessage(error));
      });
    },
    [user],
  );

  const toggleSaved = useCallback(
    (book: SaveableBook) => {
      if (!user) {
        return;
      }

      const bookId = book.googleBookId;
      const previous = savedIdsRef.current;
      const wasSaved = previous.includes(bookId);
      const next = wasSaved
        ? previous.filter((id) => id !== bookId)
        : [...previous, bookId];
      const mutationVersion =
        (savedMutationVersions.current.get(bookId) ?? 0) + 1;
      savedMutationVersions.current.set(bookId, mutationVersion);

      savedIdsRef.current = next;
      setSavedIds(next);
      setLibraryError('');

      const request = wasSaved
        ? removeBookForUser(user.uid, bookId)
        : saveBookForUser(user.uid, book);

      void request
        .then(() => {
          if (savedMutationVersions.current.get(bookId) === mutationVersion) {
            savedMutationVersions.current.delete(bookId);
          }
        })
        .catch((error) => {
          if (savedMutationVersions.current.get(bookId) === mutationVersion) {
            const current = savedIdsRef.current;
            const rolledBack = wasSaved
              ? current.includes(bookId)
                ? current
                : [...current, bookId]
              : current.filter((id) => id !== bookId);
            savedIdsRef.current = rolledBack;
            setSavedIds(rolledBack);
            savedMutationVersions.current.delete(bookId);
          }
          setLibraryError(getDatabaseErrorMessage(error));
        });
    },
    [user],
  );

  const resetLibrary = useCallback(() => {
    interestsRef.current = [];
    savedIdsRef.current = [];
    savedMutationVersions.current.clear();
    setDisplayName('Reader');
    setSelectedInterests([]);
    setSavedIds([]);
    setSavedBookDocuments([]);
    setLibraryError('');
  }, []);

  const clearLibraryError = useCallback(() => setLibraryError(''), []);
  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);

  const isSaved = useCallback(
    (bookId: string) => savedIdSet.has(bookId),
    [savedIdSet],
  );

  const savedBooks = useMemo(
    () =>
      savedBookDocuments.filter((book) =>
        savedIdSet.has(book.googleBookId),
      ),
    [savedBookDocuments, savedIdSet],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      displayName,
      setDisplayName,
      selectedInterests,
      toggleInterest,
      savedIds,
      toggleSaved,
      isSaved,
      savedBooks,
      isLibraryLoading,
      libraryError,
      clearLibraryError,
      resetLibrary,
    }),
    [
      clearLibraryError,
      displayName,
      isLibraryLoading,
      isSaved,
      libraryError,
      resetLibrary,
      savedBooks,
      savedIds,
      selectedInterests,
      toggleInterest,
      toggleSaved,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);

  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider.');
  }

  return context;
}
