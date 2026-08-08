import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  BookProviderError,
  RecommendationInputError,
  getBookRecommendations,
} from './getBookRecommendations.mjs';
import {
  FirebaseAuthError,
  verifyFirebaseIdToken,
} from './firebaseAuth.mjs';
import { InMemoryRateLimiter } from './rateLimiter.mjs';

const ENDPOINT_PATH = '/getBookRecommendations';
const MAX_BODY_BYTES = 16 * 1024;
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:8081', 'http://127.0.0.1:8081'];

class HttpError extends Error {
  constructor(statusCode, code, message, headers = {}) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.headers = headers;
  }
}

function envInteger(name, fallback, minimum, maximum) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, parsed));
}

function parseAllowedOrigins(value) {
  if (Array.isArray(value)) {
    return new Set(value.map((origin) => origin.trim()).filter(Boolean));
  }

  if (typeof value === 'string' && value.trim()) {
    return new Set(value.split(',').map((origin) => origin.trim()).filter(Boolean));
  }

  return new Set(DEFAULT_ALLOWED_ORIGINS);
}

function applyCors(request, response, allowedOrigins) {
  const origin = request.headers.origin;
  if (!origin) {
    return true;
  }

  if (!allowedOrigins.has('*') && !allowedOrigins.has(origin)) {
    return false;
  }

  response.setHeader('Access-Control-Allow-Origin', allowedOrigins.has('*') ? '*' : origin);
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.setHeader('Access-Control-Max-Age', '600');
  response.setHeader('Vary', 'Origin');
  return true;
}

function sendJson(response, statusCode, body, headers = {}) {
  if (response.writableEnded || response.destroyed) {
    return;
  }

  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(payload);
}

function extractBearerToken(request) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== 'string') {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Sign in to request book recommendations.', {
      'WWW-Authenticate': 'Bearer',
    });
  }

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  if (!match) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Sign in to request book recommendations.', {
      'WWW-Authenticate': 'Bearer',
    });
  }

  return match[1];
}

function readJsonBody(request) {
  const contentType = request.headers['content-type'];
  if (typeof contentType !== 'string' || !/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new HttpError(415, 'JSON_REQUIRED', 'Content-Type must be application/json.');
  }

  const contentLength = request.headers['content-length'];
  if (contentLength !== undefined) {
    const parsedLength = Number(contentLength);
    if (!Number.isInteger(parsedLength) || parsedLength < 0) {
      throw new HttpError(400, 'INVALID_BODY', 'The request body is invalid.');
    }
    if (parsedLength > MAX_BODY_BYTES) {
      throw new HttpError(413, 'BODY_TOO_LARGE', 'The request body is too large.');
    }
  }

  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let receivedBytes = 0;
    let settled = false;

    request.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_BODY_BYTES) {
        if (!settled) {
          settled = true;
          rejectBody(new HttpError(413, 'BODY_TOO_LARGE', 'The request body is too large.'));
        }
        return;
      }

      if (!settled) {
        chunks.push(chunk);
      }
    });

    request.on('end', () => {
      if (settled) {
        return;
      }
      settled = true;

      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) {
        rejectBody(new HttpError(400, 'INVALID_BODY', 'A JSON request body is required.'));
        return;
      }

      try {
        resolveBody(JSON.parse(text));
      } catch {
        rejectBody(new HttpError(400, 'INVALID_JSON', 'The request body must be valid JSON.'));
      }
    });

    request.on('aborted', () => {
      if (!settled) {
        settled = true;
        rejectBody(new HttpError(400, 'REQUEST_ABORTED', 'The request was cancelled.'));
      }
    });

    request.on('error', (error) => {
      if (!settled) {
        settled = true;
        rejectBody(new HttpError(400, 'REQUEST_ERROR', 'The request could not be read.'));
      }
    });
  });
}

function normalizeError(error) {
  if (
    error instanceof HttpError ||
    error instanceof RecommendationInputError ||
    error instanceof BookProviderError ||
    error instanceof FirebaseAuthError
  ) {
    return error;
  }

  return new HttpError(500, 'INTERNAL_ERROR', 'The server could not complete the request.');
}

export function createRequestHandler(options = {}) {
  const allowedOrigins = parseAllowedOrigins(options.allowedOrigins ?? process.env.ALLOWED_ORIGINS);
  const verifyToken = options.verifyToken ?? verifyFirebaseIdToken;
  const recommendationProvider = options.recommendationProvider ?? getBookRecommendations;
  const projectId = options.projectId ?? process.env.FIREBASE_PROJECT_ID;
  const rateLimiter =
    options.rateLimiter ??
    new InMemoryRateLimiter({
      maxRequests: envInteger('RATE_LIMIT_MAX', 30, 1, 1_000),
      windowMs: envInteger('RATE_LIMIT_WINDOW_MS', 60_000, 1_000, 60 * 60 * 1000),
    });

  return async function requestHandler(request, response) {
    let pathname;
    try {
      pathname = new URL(request.url ?? '/', 'http://slidebook.local').pathname;
    } catch {
      sendJson(response, 400, { error: { code: 'INVALID_URL', message: 'Invalid request URL.' } });
      return;
    }

    if (pathname !== ENDPOINT_PATH) {
      sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Route not found.' } });
      return;
    }

    if (!applyCors(request, response, allowedOrigins)) {
      sendJson(response, 403, {
        error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This web origin is not allowed.' },
      });
      return;
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Cache-Control': 'no-store',
        'Content-Length': '0',
      });
      response.end();
      return;
    }

    if (request.method !== 'POST') {
      sendJson(
        response,
        405,
        { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for this endpoint.' } },
        { Allow: 'POST, OPTIONS' },
      );
      return;
    }

    const abortController = new AbortController();
    const abortOnDisconnect = () => abortController.abort();
    request.once('aborted', abortOnDisconnect);
    response.once('close', () => {
      if (!response.writableEnded) {
        abortOnDisconnect();
      }
    });

    try {
      const token = extractBearerToken(request);
      const authenticatedUser = await verifyToken(token, { projectId });
      if (!authenticatedUser || typeof authenticatedUser.uid !== 'string' || !authenticatedUser.uid) {
        throw new FirebaseAuthError('INVALID_TOKEN', 'A valid Firebase ID token is required.');
      }

      const rateLimit = rateLimiter.consume(authenticatedUser.uid);
      response.setHeader('X-RateLimit-Limit', String(rateLimiter.maxRequests ?? ''));
      response.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.setHeader('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)));
      if (!rateLimit.allowed) {
        throw new HttpError(
          429,
          'RATE_LIMITED',
          'Too many recommendation requests. Please try again shortly.',
          { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        );
      }

      const body = await readJsonBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new HttpError(400, 'INVALID_BODY', 'The request body must be a JSON object.');
      }

      const books = await recommendationProvider(body.interests, {
        signal: abortController.signal,
      });
      sendJson(response, 200, { books });
    } catch (caughtError) {
      const error = normalizeError(caughtError);
      const statusCode = error.statusCode ?? 500;
      const headers = { ...(error.headers ?? {}) };
      if (statusCode === 401 && !headers['WWW-Authenticate']) {
        headers['WWW-Authenticate'] = 'Bearer';
      }

      if (statusCode >= 500) {
        console.error('[getBookRecommendations]', {
          code: error.code ?? 'INTERNAL_ERROR',
          message: error.message,
        });
      }

      sendJson(
        response,
        statusCode,
        {
          error: {
            code: error.code ?? 'INTERNAL_ERROR',
            message:
              statusCode >= 500 && !(error instanceof BookProviderError)
                ? 'The server could not complete the request.'
                : error.message,
          },
        },
        headers,
      );
    } finally {
      request.removeListener('aborted', abortOnDisconnect);
    }
  };
}

export function createRecommendationServer(options = {}) {
  const server = createServer(createRequestHandler(options));
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}

function parsePort(value) {
  const port = Number.parseInt(value ?? '', 10);
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : 8787;
}

const isMainModule =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  const port = parsePort(process.env.PORT);
  const host = process.env.HOST?.trim() || '127.0.0.1';
  const server = createRecommendationServer();

  server.listen(port, host, () => {
    console.log(`Slidebook recommendations backend listening on http://${host}:${port}`);
  });

  const closeGracefully = () => {
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', closeGracefully);
  process.once('SIGTERM', closeGracefully);
}
