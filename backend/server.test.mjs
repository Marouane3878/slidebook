import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryRateLimiter } from './rateLimiter.mjs';
import { createRecommendationServer } from './server.mjs';

async function withServer(options, callback) {
  const server = createRecommendationServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const verifyToken = async (token) => {
  if (token !== 'valid-token') {
    throw Object.assign(new Error('bad token'), {
      name: 'FirebaseAuthError',
      code: 'INVALID_TOKEN',
      statusCode: 401,
    });
  }
  return { uid: 'user-1' };
};

test('POST /getBookRecommendations returns a nested books response', async () => {
  const expectedBook = {
    googleBookId: 'book-1',
    title: 'Example',
    authors: ['Author'],
    description: 'No summary available yet.',
    thumbnail: null,
    categories: [],
    previewLink: null,
    infoLink: null,
    reason: 'Recommended from your interest-based Google Books search.',
  };

  await withServer(
    {
      verifyToken,
      allowedOrigins: ['http://localhost:8081'],
      recommendationProvider: async (interests) => {
        assert.deepEqual(interests, ['Fantasy']);
        return [expectedBook];
      },
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/getBookRecommendations`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
          Origin: 'http://localhost:8081',
        },
        body: JSON.stringify({ interests: ['Fantasy'] }),
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:8081');
      assert.match(response.headers.get('content-type'), /^application\/json/);
      const responseText = await response.text();
      assert.doesNotMatch(responseText, /```/);
      assert.deepEqual(JSON.parse(responseText), { books: [expectedBook] });
    },
  );
});

test('endpoint errors use a stable nested error shape', async () => {
  await withServer({ verifyToken }, async (baseUrl) => {
    const unauthorized = await fetch(`${baseUrl}/getBookRecommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests: ['Fantasy'] }),
    });
    assert.equal(unauthorized.status, 401);
    assert.deepEqual(await unauthorized.json(), {
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Sign in to request book recommendations.',
      },
    });

    const invalidInterests = await fetch(`${baseUrl}/getBookRecommendations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests: 'Fantasy' }),
    });
    assert.equal(invalidInterests.status, 400);
    assert.deepEqual(await invalidInterests.json(), {
      error: {
        code: 'INVALID_INTERESTS',
        message: 'interests must be an array of strings.',
      },
    });
  });
});

test('CORS preflight and per-user rate limiting are enforced', async () => {
  const rateLimiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 60_000 });

  await withServer(
    {
      verifyToken,
      allowedOrigins: ['http://allowed.example'],
      rateLimiter,
      recommendationProvider: async () => [],
    },
    async (baseUrl) => {
      const preflight = await fetch(`${baseUrl}/getBookRecommendations`, {
        method: 'OPTIONS',
        headers: { Origin: 'http://allowed.example' },
      });
      assert.equal(preflight.status, 204);
      assert.equal(preflight.headers.get('access-control-allow-methods'), 'POST, OPTIONS');

      const denied = await fetch(`${baseUrl}/getBookRecommendations`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
          Origin: 'http://denied.example',
        },
        body: JSON.stringify({ interests: ['Fantasy'] }),
      });
      assert.equal(denied.status, 403);
      assert.equal((await denied.json()).error.code, 'ORIGIN_NOT_ALLOWED');

      const request = () =>
        fetch(`${baseUrl}/getBookRecommendations`, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ interests: ['Fantasy'] }),
        });

      assert.equal((await request()).status, 200);
      const limited = await request();
      assert.equal(limited.status, 429);
      assert.equal(limited.headers.get('retry-after'), '60');
      assert.deepEqual(await limited.json(), {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many recommendation requests. Please try again shortly.',
        },
      });
    },
  );
});
