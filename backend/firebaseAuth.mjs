import { constants, verify as verifySignature } from 'node:crypto';

const FIREBASE_CERTIFICATES_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const DEFAULT_CERTIFICATE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_CERTIFICATE_TIMEOUT_MS = 5_000;
const CLOCK_SKEW_SECONDS = 300;
const MAX_TOKEN_LENGTH = 16_384;

const certificateCaches = new Map();

export class FirebaseAuthError extends Error {
  constructor(code, message, statusCode = 401, cause) {
    super(message, cause ? { cause } : undefined);
    this.name = 'FirebaseAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function decodeBase64Url(segment, label) {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new FirebaseAuthError('INVALID_TOKEN', `The Firebase token ${label} is invalid.`);
  }

  try {
    return Buffer.from(segment, 'base64url');
  } catch (error) {
    throw new FirebaseAuthError(
      'INVALID_TOKEN',
      `The Firebase token ${label} is invalid.`,
      401,
      error,
    );
  }
}

function decodeJsonSegment(segment, label) {
  try {
    return JSON.parse(decodeBase64Url(segment, label).toString('utf8'));
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      throw error;
    }

    throw new FirebaseAuthError(
      'INVALID_TOKEN',
      `The Firebase token ${label} is invalid.`,
      401,
      error,
    );
  }
}

function parseCertificateMaxAge(cacheControl) {
  const match = /(?:^|,)\s*max-age=(\d+)/i.exec(cacheControl ?? '');
  if (!match) {
    return DEFAULT_CERTIFICATE_TTL_MS;
  }

  const maxAgeSeconds = Number.parseInt(match[1], 10);
  if (!Number.isFinite(maxAgeSeconds)) {
    return DEFAULT_CERTIFICATE_TTL_MS;
  }

  return Math.min(24 * 60 * 60 * 1000, Math.max(0, maxAgeSeconds * 1000));
}

function validateCertificateMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FirebaseAuthError(
      'AUTH_CERTIFICATES_UNAVAILABLE',
      'Firebase authentication certificates are unavailable.',
      503,
    );
  }

  const certificates = Object.create(null);
  for (const [keyId, certificate] of Object.entries(value)) {
    if (
      typeof keyId === 'string' &&
      keyId &&
      typeof certificate === 'string' &&
      certificate.includes('-----BEGIN')
    ) {
      certificates[keyId] = certificate;
    }
  }

  if (Object.keys(certificates).length === 0) {
    throw new FirebaseAuthError(
      'AUTH_CERTIFICATES_UNAVAILABLE',
      'Firebase authentication certificates are unavailable.',
      503,
    );
  }

  return certificates;
}

async function fetchFirebaseCertificates(options) {
  const cacheKey = options.certificatesUrl;
  const now = Date.now();
  const existing = certificateCaches.get(cacheKey);

  if (existing?.certificates && existing.expiresAt > now) {
    return existing.certificates;
  }

  if (existing?.promise) {
    return existing.promise;
  }

  const requestPromise = (async () => {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), options.timeoutMs);
    timeoutId.unref?.();

    try {
      let response;
      try {
        response = await options.fetchImpl(options.certificatesUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: timeoutController.signal,
        });
      } catch (error) {
        throw new FirebaseAuthError(
          'AUTH_CERTIFICATES_UNAVAILABLE',
          'Firebase authentication certificates are unavailable.',
          503,
          error,
        );
      }

      if (!response.ok) {
        throw new FirebaseAuthError(
          'AUTH_CERTIFICATES_UNAVAILABLE',
          'Firebase authentication certificates are unavailable.',
          503,
        );
      }

      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        throw new FirebaseAuthError(
          'AUTH_CERTIFICATES_UNAVAILABLE',
          'Firebase authentication certificates are unavailable.',
          503,
          error,
        );
      }

      const certificates = validateCertificateMap(payload);
      certificateCaches.set(cacheKey, {
        certificates,
        expiresAt: Date.now() + parseCertificateMaxAge(response.headers.get('cache-control')),
      });
      return certificates;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  certificateCaches.set(cacheKey, {
    certificates: existing?.certificates,
    expiresAt: existing?.expiresAt ?? 0,
    promise: requestPromise,
  });

  try {
    return await requestPromise;
  } catch (error) {
    const current = certificateCaches.get(cacheKey);
    if (current?.promise === requestPromise) {
      certificateCaches.delete(cacheKey);
    }
    throw error;
  }
}

function requireNumericClaim(payload, name) {
  if (typeof payload[name] !== 'number' || !Number.isFinite(payload[name])) {
    throw new FirebaseAuthError('INVALID_TOKEN', `The Firebase token ${name} claim is invalid.`);
  }

  return payload[name];
}

/**
 * Verifies a Firebase ID token using Google's public SecureToken certificates.
 * This does not require the Firebase Admin SDK or a service-account credential.
 */
export async function verifyFirebaseIdToken(token, options = {}) {
  const projectId =
    (typeof options.projectId === 'string' ? options.projectId.trim() : '') ||
    (process.env.FIREBASE_PROJECT_ID ?? '').trim() ||
    (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim();
  if (!projectId) {
    throw new FirebaseAuthError(
      'AUTH_NOT_CONFIGURED',
      'FIREBASE_PROJECT_ID is required by the backend.',
      500,
    );
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'A valid Firebase ID token is required.');
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'A valid Firebase ID token is required.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = decodeJsonSegment(encodedHeader, 'header');
  const payload = decodeJsonSegment(encodedPayload, 'payload');

  if (
    !header ||
    typeof header !== 'object' ||
    header.alg !== 'RS256' ||
    typeof header.kid !== 'string' ||
    !header.kid
  ) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token header is invalid.');
  }

  if (header.typ !== undefined && header.typ !== 'JWT') {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token type is invalid.');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token payload is invalid.');
  }

  const certificates = options.certificates
    ? validateCertificateMap(options.certificates)
    : await fetchFirebaseCertificates({
        fetchImpl: options.fetchImpl ?? globalThis.fetch,
        certificatesUrl: options.certificatesUrl ?? FIREBASE_CERTIFICATES_URL,
        timeoutMs: options.timeoutMs ?? DEFAULT_CERTIFICATE_TIMEOUT_MS,
      });

  if (!Object.prototype.hasOwnProperty.call(certificates, header.kid)) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token signing key is unknown.');
  }

  let signatureIsValid = false;
  try {
    signatureIsValid = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${encodedHeader}.${encodedPayload}`, 'ascii'),
      {
        key: certificates[header.kid],
        padding: constants.RSA_PKCS1_PADDING,
      },
      decodeBase64Url(encodedSignature, 'signature'),
    );
  } catch (error) {
    throw new FirebaseAuthError(
      'INVALID_TOKEN',
      'The Firebase token signature is invalid.',
      401,
      error,
    );
  }

  if (!signatureIsValid) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token signature is invalid.');
  }

  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.aud !== projectId || payload.iss !== expectedIssuer) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token project claims are invalid.');
  }

  if (
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0 ||
    payload.sub.length > 128
  ) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token subject is invalid.');
  }

  const expiration = requireNumericClaim(payload, 'exp');
  const issuedAt = requireNumericClaim(payload, 'iat');
  const authenticatedAt = requireNumericClaim(payload, 'auth_time');
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);

  if (expiration <= nowSeconds - CLOCK_SKEW_SECONDS) {
    throw new FirebaseAuthError('TOKEN_EXPIRED', 'The Firebase ID token has expired.');
  }

  if (issuedAt > nowSeconds + CLOCK_SKEW_SECONDS) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token was issued in the future.');
  }

  if (authenticatedAt > nowSeconds + CLOCK_SKEW_SECONDS) {
    throw new FirebaseAuthError(
      'INVALID_TOKEN',
      'The Firebase token authentication time is invalid.',
    );
  }

  if (expiration <= issuedAt) {
    throw new FirebaseAuthError('INVALID_TOKEN', 'The Firebase token lifetime is invalid.');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    emailVerified: payload.email_verified === true,
    claims: payload,
  };
}

export function clearFirebaseCertificateCache() {
  certificateCaches.clear();
}
