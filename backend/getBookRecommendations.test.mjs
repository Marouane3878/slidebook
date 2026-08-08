import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_DESCRIPTION,
  clearRecommendationCache,
  getBookRecommendations,
} from './getBookRecommendations.mjs';
import { DEFAULT_RECOMMENDATION_REASON } from './rankBookRecommendations.mjs';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test.beforeEach(() => clearRecommendationCache());

test('maps Google volumes to the public book shape and converts descriptions to plain text', async () => {
  const requests = [];
  const fakeFetch = async (url, options) => {
    requests.push({ url: new URL(url), options });
    return jsonResponse({
      items: [
        {
          id: 'book-1',
          volumeInfo: {
            title: '  A Good Book  ',
            authors: ['Ada Author', 'Ada Author', '  Ben Writer  '],
            description:
              '<p>A <strong>bold &amp; bright</strong><br>story &#x1F4DA;.</p><script>bad()</script>',
            imageLinks: { thumbnail: 'http://books.google.com/cover?id=1' },
            categories: ['Fiction', 'fiction', 'Adventure'],
            previewLink: 'http://books.google.com/preview?id=1',
            infoLink: 'javascript:alert(1)',
          },
        },
        {
          id: 'book-2',
          volumeInfo: {
            title: 'A Book Without a Summary',
            description: '   ',
            imageLinks: { smallThumbnail: 'https://books.google.com/small?id=2' },
          },
        },
        {
          id: 'book-without-title',
          volumeInfo: {
            authors: ['Not returned because its title is missing'],
          },
        },
      ],
    });
  };

  const books = await getBookRecommendations(['Fantasy'], {
    fetchImpl: fakeFetch,
    apiKey: 'server-only-key',
    cacheTtlMs: 0,
  });

  assert.deepEqual(books, [
    {
      googleBookId: 'book-1',
      title: 'A Good Book',
      authors: ['Ada Author', 'Ben Writer'],
      description: 'A bold & bright story 📚.',
      thumbnail: 'https://books.google.com/cover?id=1',
      categories: ['Fiction', 'Adventure'],
      previewLink: 'https://books.google.com/preview?id=1',
      infoLink: null,
      reason: DEFAULT_RECOMMENDATION_REASON,
    },
    {
      googleBookId: 'book-2',
      title: 'A Book Without a Summary',
      authors: [],
      description: DEFAULT_DESCRIPTION,
      thumbnail: 'https://books.google.com/small?id=2',
      categories: [],
      previewLink: null,
      infoLink: null,
      reason: DEFAULT_RECOMMENDATION_REASON,
    },
  ]);

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.headers['X-Goog-Api-Key'], 'server-only-key');
  assert.equal(requests[0].url.searchParams.get('q'), 'subject:"fantasy"');
  assert.equal(requests[0].url.searchParams.has('key'), false);
});

test('maps Slidebook interest IDs to useful Google Books subject terms', async () => {
  const queries = [];
  const fakeFetch = async (url) => {
    queries.push(new URL(url).searchParams.get('q'));
    return jsonResponse({ items: [] });
  };

  await getBookRecommendations(['science-fiction', 'self-growth', 'historical'], {
    fetchImpl: fakeFetch,
    apiKey: 'server-only-key',
    cacheTtlMs: 0,
  });

  assert.deepEqual(queries, [
    'subject:"science fiction"',
    'subject:"self help"',
    'subject:"historical fiction"',
  ]);
});

test('deduplicates books across interests and coalesces matching cached requests', async () => {
  let callCount = 0;
  const fakeFetch = async () => {
    callCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return jsonResponse({
      items: [
        {
          id: 'same-book',
          volumeInfo: { title: 'Shared result' },
        },
      ],
    });
  };

  const [first, second] = await Promise.all([
    getBookRecommendations(['Fantasy', 'History'], {
      fetchImpl: fakeFetch,
      apiKey: 'server-only-key',
      cacheTtlMs: 1_000,
    }),
    getBookRecommendations([' fantasy ', 'history'], {
      fetchImpl: fakeFetch,
      apiKey: 'server-only-key',
      cacheTtlMs: 1_000,
    }),
  ]);

  assert.equal(callCount, 2);
  assert.equal(first.length, 1);
  assert.deepEqual(second, first);
  assert.notEqual(second, first);
  assert.notEqual(second[0].authors, first[0].authors);
});

test('aborting one caller does not cancel shared cached Google Books work', async () => {
  let releaseGoogleRequests;
  const googleRequestsReleased = new Promise((resolve) => {
    releaseGoogleRequests = resolve;
  });
  const upstreamSignals = [];
  let callCount = 0;

  const fakeFetch = async (url, options) => {
    callCount += 1;
    upstreamSignals.push(options.signal);

    await new Promise((resolve, reject) => {
      const handleAbort = () => {
        const error = new Error('Google request aborted');
        error.name = 'AbortError';
        reject(error);
      };

      if (options.signal.aborted) {
        handleAbort();
        return;
      }

      options.signal.addEventListener('abort', handleAbort, { once: true });
      googleRequestsReleased.then(() => {
        options.signal.removeEventListener('abort', handleAbort);
        resolve();
      });
    });

    const query = new URL(url).searchParams.get('q');
    return jsonResponse({
      items: [
        {
          id: query.includes('fantasy') ? 'fantasy-book' : 'history-book',
          volumeInfo: { title: 'Shared result' },
        },
      ],
    });
  };

  const firstCaller = new AbortController();
  const firstRequest = getBookRecommendations(['fantasy', 'historical'], {
    fetchImpl: fakeFetch,
    apiKey: 'server-only-key',
    cacheTtlMs: 1_000,
    signal: firstCaller.signal,
  });
  const secondRequest = getBookRecommendations(['fantasy', 'historical'], {
    fetchImpl: fakeFetch,
    apiKey: 'server-only-key',
    cacheTtlMs: 1_000,
  });
  const secondOutcome = secondRequest.then(
    (books) => ({ books, error: null }),
    (error) => ({ books: null, error }),
  );

  try {
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(callCount, 2);

    const firstRejection = assert.rejects(
      firstRequest,
      (error) => error.code === 'REQUEST_ABORTED' && error.statusCode === 499,
    );
    firstCaller.abort();
    await firstRejection;

    assert.equal(upstreamSignals.every((signal) => !signal.aborted), true);
    releaseGoogleRequests();

    const outcome = await secondOutcome;
    assert.equal(outcome.error, null);
    assert.deepEqual(
      outcome.books.map((book) => book.googleBookId).sort(),
      ['fantasy-book', 'history-book'],
    );
    assert.equal(callCount, 2);
  } finally {
    releaseGoogleRequests();
  }
});

test('caches raw candidates but reranks them using every supplied interest', async () => {
  let callCount = 0;
  const fakeFetch = async () => {
    callCount += 1;
    return jsonResponse({
      items: [
        {
          id: 'poetry-book',
          volumeInfo: { title: 'Poems', categories: ['Poetry'] },
        },
        {
          id: 'nature-book',
          volumeInfo: { title: 'Wild Places', categories: ['Nature'] },
        },
      ],
    });
  };

  const natureRanked = await getBookRecommendations(
    ['fantasy', 'mystery', 'romance', 'nature'],
    {
      apiKey: 'server-only-key',
      cacheTtlMs: 1_000,
      fetchImpl: fakeFetch,
    },
  );
  const poetryRanked = await getBookRecommendations(
    ['fantasy', 'mystery', 'romance', 'poetry'],
    {
      apiKey: 'server-only-key',
      cacheTtlMs: 1_000,
      fetchImpl: fakeFetch,
    },
  );

  assert.equal(callCount, 3);
  assert.equal(natureRanked[0].googleBookId, 'nature-book');
  assert.equal(poetryRanked[0].googleBookId, 'poetry-book');
});

test('validates interests before calling Google Books', async () => {
  let called = false;
  const fakeFetch = async () => {
    called = true;
    return jsonResponse({});
  };

  await assert.rejects(
    getBookRecommendations([], { fetchImpl: fakeFetch }),
    (error) => error.code === 'INVALID_INTERESTS' && error.statusCode === 400,
  );
  await assert.rejects(
    getBookRecommendations(['Fantasy', 42], { fetchImpl: fakeFetch }),
    (error) => error.code === 'INVALID_INTERESTS',
  );
  await assert.rejects(
    getBookRecommendations(Array.from({ length: 13 }, (_, index) => `Topic ${index}`), {
      fetchImpl: fakeFetch,
    }),
    (error) => error.code === 'INVALID_INTERESTS',
  );
  assert.equal(called, false);
});

test('requires the Google Books API key on the backend', async () => {
  let called = false;
  const fakeFetch = async () => {
    called = true;
    return jsonResponse({ items: [] });
  };

  await assert.rejects(
    getBookRecommendations(['Fantasy'], {
      apiKey: '',
      cacheTtlMs: 0,
      fetchImpl: fakeFetch,
    }),
    (error) =>
      error.code === 'BOOKS_NOT_CONFIGURED' && error.statusCode === 500,
  );
  assert.equal(called, false);
});
