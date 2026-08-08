import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_RECOMMENDATION_REASON,
  rankBookRecommendations,
} from './rankBookRecommendations.mjs';

function book(overrides) {
  return {
    googleBookId: overrides.googleBookId,
    title: overrides.title ?? 'Source title',
    authors: overrides.authors ?? ['Source Author'],
    description: overrides.description ?? 'Source description.',
    thumbnail: overrides.thumbnail ?? null,
    categories: overrides.categories ?? [],
    previewLink: overrides.previewLink ?? null,
    infoLink: overrides.infoLink ?? null,
  };
}

function metadataWithoutReason(value) {
  const { reason: _reason, ...metadata } = value;
  return metadata;
}

test('ranks category, title, then summary evidence without changing metadata', () => {
  const candidates = [
    book({
      googleBookId: 'summary',
      title: 'First source title',
      description: 'A journey through a magical kingdom.',
    }),
    book({
      googleBookId: 'title',
      title: 'The Fantasy Almanac',
    }),
    book({
      googleBookId: 'category',
      title: 'Third source title',
      categories: ['Fantasy'],
    }),
  ];
  Object.freeze(candidates);
  candidates.forEach((candidate) => {
    Object.freeze(candidate);
    Object.freeze(candidate.authors);
    Object.freeze(candidate.categories);
  });

  const ranked = rankBookRecommendations(['fantasy'], candidates);

  assert.deepEqual(
    ranked.map((candidate) => candidate.googleBookId),
    ['category', 'title', 'summary'],
  );
  assert.match(ranked[0].reason, /Google Books categories/);
  assert.match(ranked[1].reason, /title/);
  assert.match(ranked[2].reason, /Google Books summary/);

  const originalsById = new Map(
    candidates.map((candidate) => [candidate.googleBookId, candidate]),
  );
  for (const candidate of ranked) {
    assert.deepEqual(
      metadataWithoutReason(candidate),
      originalsById.get(candidate.googleBookId),
    );
    assert.deepEqual(Object.keys(candidate), [
      'googleBookId',
      'title',
      'authors',
      'description',
      'thumbnail',
      'categories',
      'previewLink',
      'infoLink',
      'reason',
    ]);
  }
});

test('adds scores across interests but never inflates repeated keywords', () => {
  const ranked = rankBookRecommendations(
    ['fantasy', 'mystery'],
    [
      book({
        googleBookId: 'repeated',
        title: 'Fantasy Fantasy Fantasy',
      }),
      book({
        googleBookId: 'two-interests',
        title: 'A Fantasy Mystery',
      }),
    ],
  );

  assert.equal(ranked[0].googleBookId, 'two-interests');
  assert.equal(ranked[1].googleBookId, 'repeated');
});

test('deduplicates equivalent interest aliases before scoring', () => {
  const ranked = rankBookRecommendations(
    ['science-fiction', 'sci-fi', 'nature'],
    [
      book({
        googleBookId: 'nature',
        categories: ['Nature'],
      }),
      book({
        googleBookId: 'science-fiction',
        categories: ['Science Fiction'],
      }),
    ],
  );

  assert.deepEqual(
    ranked.map((candidate) => candidate.googleBookId),
    ['nature', 'science-fiction'],
  );
});

test('matches aliases and whole phrases, not substrings', () => {
  const ranked = rankBookRecommendations(
    ['science-fiction', 'self-growth', 'art'],
    [
      book({
        googleBookId: 'earth',
        title: 'The Earth Atlas',
      }),
      book({
        googleBookId: 'self-help',
        title: 'Small Habits',
        categories: ['SELF-HELP'],
      }),
      book({
        googleBookId: 'science-fiction',
        title: 'Orbit',
        categories: ['Science Fiction'],
      }),
    ],
  );

  assert.deepEqual(
    ranked.map((candidate) => candidate.googleBookId),
    ['self-help', 'science-fiction', 'earth'],
  );
  assert.equal(ranked[2].reason, DEFAULT_RECOMMENDATION_REASON);
});

test('keeps stable Google order for ties and handles missing metadata', () => {
  const candidates = [
    book({
      googleBookId: 'first',
      authors: [],
      categories: [],
      description: 'No summary available yet.',
    }),
    book({
      googleBookId: 'second',
      authors: [],
      categories: [],
      description: 'No summary available yet.',
    }),
  ];

  const firstRun = rankBookRecommendations(['fantasy'], candidates);
  const secondRun = rankBookRecommendations(['fantasy'], candidates);

  assert.deepEqual(firstRun, secondRun);
  assert.deepEqual(
    firstRun.map((candidate) => candidate.googleBookId),
    ['first', 'second'],
  );
  assert.ok(
    firstRun.every(
      (candidate) => candidate.reason === DEFAULT_RECOMMENDATION_REASON,
    ),
  );
});

test('normalizes malformed author and category arrays without inventing values', () => {
  const ranked = rankBookRecommendations(
    ['fantasy'],
    [
      {
        googleBookId: 'incomplete',
        title: 'Source title',
        authors: null,
        description: 'Source description.',
        thumbnail: null,
        categories: null,
        previewLink: null,
        infoLink: null,
      },
    ],
  );

  assert.deepEqual(ranked[0].authors, []);
  assert.deepEqual(ranked[0].categories, []);
  assert.equal(ranked[0].reason, DEFAULT_RECOMMENDATION_REASON);
});
