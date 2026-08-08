import { rankBookRecommendations } from './rankBookRecommendations.mjs';

const GOOGLE_BOOKS_VOLUMES_URL = 'https://www.googleapis.com/books/v1/volumes';

const DEFAULT_DESCRIPTION = 'No summary available yet.';
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RESULT_LIMIT = 24;
const MAX_CACHE_ENTRIES = 100;
const MAX_INTERESTS = 12;
const MAX_SEARCH_INTERESTS = 3;
const MAX_INTEREST_LENGTH = 64;

const INTEREST_SEARCH_TERMS = new Map([
  ['contemporary', 'contemporary fiction'],
  ['mystery', 'mystery'],
  ['romance', 'romance'],
  ['fantasy', 'fantasy'],
  ['science-fiction', 'science fiction'],
  ['sci-fi', 'science fiction'],
  ['historical', 'historical fiction'],
  ['memoir', 'memoir'],
  ['self-growth', 'self help'],
  ['poetry', 'poetry'],
  ['thriller', 'thriller'],
  ['nature', 'nature'],
  ['essays', 'essays'],
]);

const recommendationCache = new Map();

export class RecommendationInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RecommendationInputError';
    this.code = 'INVALID_INTERESTS';
    this.statusCode = 400;
  }
}

export class BookProviderError extends Error {
  constructor(code, message, statusCode = 502, cause) {
    super(message, cause ? { cause } : undefined);
    this.name = 'BookProviderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function envInteger(name, fallback, minimum, maximum) {
  const value = Number.parseInt(process.env[name] ?? '', 10);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeInterests(interests) {
  if (!Array.isArray(interests)) {
    throw new RecommendationInputError('interests must be an array of strings.');
  }

  if (interests.length === 0) {
    throw new RecommendationInputError('Choose at least one interest.');
  }

  if (interests.length > MAX_INTERESTS) {
    throw new RecommendationInputError(`Choose no more than ${MAX_INTERESTS} interests.`);
  }

  const normalized = [];
  const seen = new Set();

  for (const interest of interests) {
    if (typeof interest !== 'string') {
      throw new RecommendationInputError('Every interest must be a string.');
    }

    const trimmed = interest.trim().replace(/\s+/g, ' ');

    if (!trimmed) {
      throw new RecommendationInputError('Interests cannot be empty.');
    }

    if (trimmed.length > MAX_INTEREST_LENGTH) {
      throw new RecommendationInputError(
        `Each interest must be ${MAX_INTEREST_LENGTH} characters or fewer.`,
      );
    }

    const comparisonKey = trimmed.toLocaleLowerCase('en-US');
    if (!seen.has(comparisonKey)) {
      seen.add(comparisonKey);
      normalized.push(trimmed);
    }
  }

  if (normalized.length === 0) {
    throw new RecommendationInputError('Choose at least one interest.');
  }

  return normalized;
}

function normalizeStringArray(value, fallback = []) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const values = [];
  const seen = new Set();

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const trimmed = item.trim();
    const comparisonKey = trimmed.toLocaleLowerCase('en-US');
    if (trimmed && !seen.has(comparisonKey)) {
      seen.add(comparisonKey);
      values.push(trimmed);
    }
  }

  return values.length > 0 ? values : [...fallback];
}

function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    copy: '©',
    gt: '>',
    hellip: '…',
    ldquo: '“',
    lsquo: '‘',
    lt: '<',
    mdash: '—',
    nbsp: ' ',
    ndash: '–',
    quot: '"',
    rdquo: '”',
    reg: '®',
    rsquo: '’',
  };

  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, reference) => {
    if (reference.startsWith('#')) {
      const hexadecimal = reference[1]?.toLocaleLowerCase('en-US') === 'x';
      const numericValue = Number.parseInt(reference.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      try {
        return Number.isInteger(numericValue) && numericValue > 0
          ? String.fromCodePoint(numericValue)
          : entity;
      } catch {
        return entity;
      }
    }

    return namedEntities[reference.toLocaleLowerCase('en-US')] ?? entity;
  });
}

function descriptionToPlainText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_DESCRIPTION;
  }

  const decoded = decodeHtmlEntities(value);
  const withoutUnsafeBlocks = decoded
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[^]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[^]*?<\/style\s*>/gi, ' ');
  const withBlockSpacing = withoutUnsafeBlocks.replace(
    /<(?:br\s*\/?|\/?(?:p|div|li|h[1-6]|blockquote))\b[^>]*>/gi,
    ' ',
  );
  const plainText = withBlockSpacing
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText || DEFAULT_DESCRIPTION;
}

function mapVolume(volume) {
  if (!volume || typeof volume !== 'object' || typeof volume.id !== 'string' || !volume.id.trim()) {
    return null;
  }

  const volumeInfo =
    volume.volumeInfo && typeof volume.volumeInfo === 'object' ? volume.volumeInfo : {};
  const imageLinks =
    volumeInfo.imageLinks && typeof volumeInfo.imageLinks === 'object'
      ? volumeInfo.imageLinks
      : {};
  const title =
    typeof volumeInfo.title === 'string' ? volumeInfo.title.trim() : '';
  if (!title) {
    return null;
  }
  const description = descriptionToPlainText(volumeInfo.description);

  return {
    googleBookId: volume.id.trim(),
    title,
    authors: normalizeStringArray(volumeInfo.authors),
    description,
    thumbnail: normalizeUrl(imageLinks.thumbnail ?? imageLinks.smallThumbnail),
    categories: normalizeStringArray(volumeInfo.categories),
    previewLink: normalizeUrl(volumeInfo.previewLink),
    infoLink: normalizeUrl(volumeInfo.infoLink),
  };
}

function escapeSearchTerm(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function toGoogleBooksSearchTerms(interests) {
  const searchTerms = [];
  const seen = new Set();

  for (const interest of interests) {
    const mapped =
      INTEREST_SEARCH_TERMS.get(interest.toLocaleLowerCase('en-US')) ?? interest;
    const comparisonKey = mapped.toLocaleLowerCase('en-US');

    if (!seen.has(comparisonKey)) {
      seen.add(comparisonKey);
      searchTerms.push(mapped);
    }

    if (searchTerms.length === MAX_SEARCH_INTERESTS) {
      break;
    }
  }

  return searchTerms;
}

async function searchGoogleBooks(interest, options) {
  const url = new URL(GOOGLE_BOOKS_VOLUMES_URL);
  url.searchParams.set('q', `subject:"${escapeSearchTerm(interest)}"`);
  url.searchParams.set('printType', 'books');
  url.searchParams.set('orderBy', 'relevance');
  url.searchParams.set('maxResults', String(options.resultsPerInterest));

  const headers = { Accept: 'application/json' };
  if (options.apiKey) {
    // The key stays in a server-only header and is never included in a response or URL.
    headers['X-Goog-Api-Key'] = options.apiKey;
  }

  let response;
  try {
    response = await options.fetchImpl(url, {
      method: 'GET',
      headers,
      signal: options.signal,
    });
  } catch (error) {
    if (options.didTimeout()) {
      throw new BookProviderError(
        'BOOKS_TIMEOUT',
        'The book provider took too long to respond.',
        504,
        error,
      );
    }

    if (options.signal.aborted) {
      throw new BookProviderError('REQUEST_ABORTED', 'The request was cancelled.', 499, error);
    }

    throw new BookProviderError(
      'BOOKS_UNAVAILABLE',
      'The book provider is temporarily unavailable.',
      502,
      error,
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new BookProviderError(
        'BOOKS_RATE_LIMITED',
        'The book provider is temporarily busy. Please try again shortly.',
        503,
      );
    }

    throw new BookProviderError(
      'BOOKS_UPSTREAM_ERROR',
      'The book provider could not complete the request.',
      502,
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new BookProviderError(
      'BOOKS_INVALID_RESPONSE',
      'The book provider returned an invalid response.',
      502,
      error,
    );
  }

  if (!Array.isArray(payload?.items)) {
    return [];
  }

  return payload.items.map(mapVolume).filter(Boolean);
}

function interleaveAndDedupe(resultGroups, limit) {
  const books = [];
  const seenIds = new Set();
  const largestGroup = resultGroups.reduce((largest, group) => Math.max(largest, group.length), 0);

  for (let index = 0; index < largestGroup && books.length < limit; index += 1) {
    for (const group of resultGroups) {
      const book = group[index];
      if (!book || seenIds.has(book.googleBookId)) {
        continue;
      }

      seenIds.add(book.googleBookId);
      books.push(book);

      if (books.length === limit) {
        break;
      }
    }
  }

  return books;
}

function cloneBooks(books) {
  return books.map((book) => ({
    ...book,
    authors: [...book.authors],
    categories: [...book.categories],
  }));
}

function pruneCache(now) {
  for (const [key, entry] of recommendationCache) {
    if (entry.expiresAt <= now) {
      recommendationCache.delete(key);
    }
  }

  while (recommendationCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = recommendationCache.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    recommendationCache.delete(oldestKey);
  }
}

async function fetchRecommendations(interests, options) {
  const timeoutController = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, options.timeoutMs);
  timeoutId.unref?.();

  const signals = [timeoutController.signal];
  if (options.signal) {
    signals.push(options.signal);
  }
  const signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);

  try {
    const settled = await Promise.allSettled(
      interests.map((interest) =>
        searchGoogleBooks(interest, {
          ...options,
          signal,
          didTimeout: () => timedOut,
        }),
      ),
    );
    const successfulGroups = settled
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    if (successfulGroups.length === 0) {
      const firstFailure = settled.find((result) => result.status === 'rejected');
      throw firstFailure?.reason instanceof Error
        ? firstFailure.reason
        : new BookProviderError(
            'BOOKS_UNAVAILABLE',
            'The book provider is temporarily unavailable.',
          );
    }

    return interleaveAndDedupe(successfulGroups, options.maxResults);
  } finally {
    clearTimeout(timeoutId);
  }
}

function createRequestAbortedError(signal) {
  return new BookProviderError(
    'REQUEST_ABORTED',
    'The request was cancelled.',
    499,
    signal?.reason,
  );
}

function waitForRecommendations(requestPromise, signal) {
  if (!signal) {
    return requestPromise;
  }

  if (signal.aborted) {
    return Promise.reject(createRequestAbortedError(signal));
  }

  return new Promise((resolveRequest, rejectRequest) => {
    const handleAbort = () => rejectRequest(createRequestAbortedError(signal));
    signal.addEventListener('abort', handleAbort, { once: true });

    requestPromise.then(
      (books) => {
        signal.removeEventListener('abort', handleAbort);
        resolveRequest(books);
      },
      (error) => {
        signal.removeEventListener('abort', handleAbort);
        rejectRequest(error);
      },
    );
  });
}

/**
 * Fetches Google Books recommendations for a user's interests.
 *
 * @param {string[]} interests
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   apiKey?: string,
 *   signal?: AbortSignal,
 *   timeoutMs?: number,
 *   maxResults?: number,
 *   cacheTtlMs?: number,
 * }} options
 */
export async function getBookRecommendations(interests, options = {}) {
  const normalizedInterests = normalizeInterests(interests);
  const searchInterests = toGoogleBooksSearchTerms(normalizedInterests);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new BookProviderError(
      'BOOKS_CONFIGURATION_ERROR',
      'This Node runtime does not provide fetch.',
      500,
    );
  }

  const maxResults = Math.min(
    40,
    Math.max(1, options.maxResults ?? DEFAULT_RESULT_LIMIT),
  );
  const timeoutMs = Math.min(
    30_000,
    Math.max(
      1_000,
      options.timeoutMs ??
        envInteger('GOOGLE_BOOKS_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, 1_000, 30_000),
    ),
  );
  const cacheTtlMs = Math.min(
    60 * 60 * 1000,
    Math.max(
      0,
      options.cacheTtlMs ??
        envInteger(
          'RECOMMENDATION_CACHE_TTL_MS',
          DEFAULT_CACHE_TTL_MS,
          0,
          60 * 60 * 1000,
        ),
    ),
  );
  const resultsPerInterest = Math.min(
    20,
    Math.max(5, Math.ceil(maxResults / searchInterests.length) + 2),
  );
  const apiKey =
    typeof options.apiKey === 'string'
      ? options.apiKey.trim()
      : (process.env.GOOGLE_BOOKS_API_KEY ?? '').trim();
  if (!apiKey) {
    throw new BookProviderError(
      'BOOKS_NOT_CONFIGURED',
      'The Google Books API key is not configured on the backend.',
      500,
    );
  }
  const cacheKey = `${searchInterests
    .map((interest) => interest.toLocaleLowerCase('en-US'))
    .join('|')}::${maxResults}`;
  const now = Date.now();

  if (options.signal?.aborted) {
    throw createRequestAbortedError(options.signal);
  }

  let requestPromise;
  if (cacheTtlMs > 0) {
    const cached = recommendationCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      requestPromise = cached.promise;
    } else {
      pruneCache(now);
    }
  }

  if (!requestPromise) {
    requestPromise = fetchRecommendations(searchInterests, {
      fetchImpl,
      apiKey,
      // Cached work may be shared by several callers, so it must not inherit
      // the first caller's cancellation signal. Each caller races this shared
      // promise against its own signal below. Uncached work can be cancelled
      // at the upstream fetch as usual.
      signal: cacheTtlMs > 0 ? undefined : options.signal,
      timeoutMs,
      maxResults,
      resultsPerInterest,
    });

    if (cacheTtlMs > 0) {
      recommendationCache.set(cacheKey, {
        expiresAt: now + cacheTtlMs,
        promise: requestPromise,
      });

      // Remove failed upstream work from the cache independently of any one
      // caller choosing to stop waiting for it.
      void requestPromise.catch(() => {
        const cached = recommendationCache.get(cacheKey);
        if (cached?.promise === requestPromise) {
          recommendationCache.delete(cacheKey);
        }
      });
    }
  }

  const candidateBooks = cloneBooks(
    await waitForRecommendations(requestPromise, options.signal),
  );
  return rankBookRecommendations(normalizedInterests, candidateBooks);
}

export function clearRecommendationCache() {
  recommendationCache.clear();
}

export { DEFAULT_DESCRIPTION };
