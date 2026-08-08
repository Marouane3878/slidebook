import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';

import { verifyFirebaseIdToken } from './firebaseAuth.mjs';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const PROJECT_ID = 'slidebook-test';
const KEY_ID = 'test-key';
const NOW_SECONDS = 2_000_000_000;

function createToken(overrides = {}, headerOverrides = {}) {
  const header = { alg: 'RS256', typ: 'JWT', kid: KEY_ID, ...headerOverrides };
  const payload = {
    aud: PROJECT_ID,
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'firebase-user-123',
    email: 'reader@example.com',
    email_verified: true,
    auth_time: NOW_SECONDS - 60,
    iat: NOW_SECONDS - 60,
    exp: NOW_SECONDS + 3_600,
    ...overrides,
  };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    privateKey,
  ).toString('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

test('verifies a Firebase ID token without a service-account credential', async () => {
  const verified = await verifyFirebaseIdToken(createToken(), {
    projectId: PROJECT_ID,
    certificates: { [KEY_ID]: publicKey },
    nowMs: NOW_SECONDS * 1000,
  });

  assert.equal(verified.uid, 'firebase-user-123');
  assert.equal(verified.email, 'reader@example.com');
  assert.equal(verified.emailVerified, true);
});

test('rejects tokens for a different Firebase project', async () => {
  await assert.rejects(
    verifyFirebaseIdToken(createToken({ aud: 'another-project' }), {
      projectId: PROJECT_ID,
      certificates: { [KEY_ID]: publicKey },
      nowMs: NOW_SECONDS * 1000,
    }),
    (error) => error.code === 'INVALID_TOKEN' && error.statusCode === 401,
  );
});

test('rejects expired tokens and invalid signatures', async () => {
  await assert.rejects(
    verifyFirebaseIdToken(createToken({ exp: NOW_SECONDS - 1_000 }), {
      projectId: PROJECT_ID,
      certificates: { [KEY_ID]: publicKey },
      nowMs: NOW_SECONDS * 1000,
    }),
    (error) => error.code === 'TOKEN_EXPIRED',
  );

  const token = createToken();
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  const tamperedSignature = Buffer.from(encodedSignature, 'base64url');
  tamperedSignature[0] ^= 0xff;
  const tampered = `${encodedHeader}.${encodedPayload}.${tamperedSignature.toString('base64url')}`;
  await assert.rejects(
    verifyFirebaseIdToken(tampered, {
      projectId: PROJECT_ID,
      certificates: { [KEY_ID]: publicKey },
      nowMs: NOW_SECONDS * 1000,
    }),
    (error) => error.code === 'INVALID_TOKEN',
  );
});
