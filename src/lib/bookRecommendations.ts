import type { User } from 'firebase/auth';

import {
  NO_SUMMARY_AVAILABLE,
  RECOMMENDATION_REASON_UNAVAILABLE,
  type BookRecommendation,
} from '../types/recommendations';

const configuredBackendUrl = (process.env.EXPO_PUBLIC_BACKEND_URL ?? '')
  .trim()
  .replace(/\/+$/, '');
const backendUrl =
  configuredBackendUrl || (__DEV__ ? 'http://localhost:8787' : '');

export const recommendationConfigurationError = backendUrl
  ? null
  : 'Book recommendations are not configured yet. Add EXPO_PUBLIC_BACKEND_URL to .env.local and restart Expo.';

export class BookRecommendationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookRecommendationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const url = value.trim().replace(/^http:\/\//i, 'https://');
  return url.startsWith('https://') ? url : null;
}

function parseBook(value: unknown): BookRecommendation | null {
  if (!isRecord(value)) {
    return null;
  }

  const googleBookId =
    typeof value.googleBookId === 'string' ? value.googleBookId.trim() : '';
  const title = typeof value.title === 'string' ? value.title.trim() : '';

  if (!googleBookId || !title) {
    return null;
  }

  const description =
    typeof value.description === 'string' && value.description.trim()
      ? value.description.trim()
      : NO_SUMMARY_AVAILABLE;
  const reason =
    typeof value.reason === 'string' && value.reason.trim()
      ? value.reason
          .replace(/[\u0000-\u001f\u007f]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 300)
      : RECOMMENDATION_REASON_UNAVAILABLE;

  return {
    googleBookId,
    title,
    authors: stringArray(value.authors),
    description,
    thumbnail: optionalUrl(value.thumbnail),
    categories: stringArray(value.categories),
    previewLink: optionalUrl(value.previewLink),
    infoLink: optionalUrl(value.infoLink),
    reason,
  };
}

function responseMessage(status: number, body: unknown): string {
  if (isRecord(body) && typeof body.error === 'string' && body.error.trim()) {
    return body.error;
  }
  if (
    isRecord(body) &&
    isRecord(body.error) &&
    typeof body.error.message === 'string' &&
    body.error.message.trim()
  ) {
    return body.error.message;
  }

  if (status === 401) {
    return 'Your session expired. Sign in again and retry.';
  }
  if (status === 429) {
    return 'Recommendations are being refreshed too often. Wait a moment and retry.';
  }

  return 'Book recommendations are unavailable right now. Please try again.';
}

export async function getBookRecommendations(
  user: User,
  interests: readonly string[],
  signal?: AbortSignal,
): Promise<BookRecommendation[]> {
  if (recommendationConfigurationError) {
    throw new BookRecommendationError(recommendationConfigurationError);
  }

  const normalizedInterests = [...new Set(
    interests.map((interest) => interest.trim()).filter(Boolean),
  )];

  if (normalizedInterests.length === 0) {
    return [];
  }

  const idToken = await user.getIdToken();
  const response = await fetch(`${backendUrl}/getBookRecommendations`, {
    body: JSON.stringify({ interests: normalizedInterests }),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new BookRecommendationError(responseMessage(response.status, body));
  }

  if (!isRecord(body) || !Array.isArray(body.books)) {
    throw new BookRecommendationError(
      'The recommendation service returned an unexpected response.',
    );
  }

  return body.books
    .map(parseBook)
    .filter((book): book is BookRecommendation => book !== null);
}
