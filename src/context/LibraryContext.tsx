import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import { BOOKS, type Book, type GenreId } from '../data/books';

const DEMO_INTERESTS: GenreId[] = ['contemporary', 'mystery', 'fantasy'];
const DEMO_SAVED_IDS = [
  'the-last-library-at-low-tide',
  'instructions-for-borrowed-light',
];

export interface LibraryContextValue {
  displayName: string;
  setDisplayName: Dispatch<SetStateAction<string>>;
  selectedInterests: GenreId[];
  setSelectedInterests: Dispatch<SetStateAction<GenreId[]>>;
  toggleInterest: (interestId: GenreId) => void;
  savedIds: string[];
  toggleSaved: (bookId: string) => void;
  isSaved: (bookId: string) => boolean;
  savedBooks: Book[];
  loadDemoAccount: (name: string) => void;
  resetLibrary: () => void;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export interface LibraryProviderProps {
  children: ReactNode;
}

export function LibraryProvider({ children }: LibraryProviderProps) {
  const [displayName, setDisplayName] = useState('Reader');
  const [selectedInterests, setSelectedInterests] =
    useState<GenreId[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const toggleInterest = useCallback((interestId: GenreId) => {
    setSelectedInterests((current) =>
      current.includes(interestId)
        ? current.filter((id) => id !== interestId)
        : [...current, interestId],
    );
  }, []);

  const toggleSaved = useCallback((bookId: string) => {
    setSavedIds((current) =>
      current.includes(bookId)
        ? current.filter((id) => id !== bookId)
        : [...current, bookId],
    );
  }, []);

  const loadDemoAccount = useCallback((name: string) => {
    setDisplayName(name);
    setSelectedInterests(DEMO_INTERESTS);
    setSavedIds(DEMO_SAVED_IDS);
  }, []);

  const resetLibrary = useCallback(() => {
    setDisplayName('Reader');
    setSelectedInterests([]);
    setSavedIds([]);
  }, []);

  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);

  const isSaved = useCallback(
    (bookId: string) => savedIdSet.has(bookId),
    [savedIdSet],
  );

  const savedBooks = useMemo(
    () => BOOKS.filter((book) => savedIdSet.has(book.id)),
    [savedIdSet],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      displayName,
      setDisplayName,
      selectedInterests,
      setSelectedInterests,
      toggleInterest,
      savedIds,
      toggleSaved,
      isSaved,
      savedBooks,
      loadDemoAccount,
      resetLibrary,
    }),
    [
      displayName,
      isSaved,
      loadDemoAccount,
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
