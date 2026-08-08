import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import {
  BookRecommendationError,
  getBookRecommendations,
} from '../lib/bookRecommendations';
import type { BookRecommendation } from '../types/recommendations';

export interface UseBookRecommendationsResult {
  books: BookRecommendation[];
  error: string;
  isLoading: boolean;
  refresh: () => void;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function useBookRecommendations(
  interests: readonly string[],
  enabled = true,
): UseBookRecommendationsResult {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookRecommendation[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const interestKey = useMemo(() => interests.join('\u001f'), [interests]);

  const refresh = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !user || interests.length === 0) {
      setBooks([]);
      setError('');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    void getBookRecommendations(user, interests, controller.signal)
      .then((recommendations) => {
        if (!controller.signal.aborted) {
          setBooks(recommendations);
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || isAbortError(requestError)) {
          return;
        }

        setBooks([]);
        setError(
          requestError instanceof BookRecommendationError
            ? requestError.message
            : 'Book recommendations are unavailable right now. Please try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, interestKey, interests, refreshVersion, user]);

  return { books, error, isLoading, refresh };
}
