const MISSING_DESCRIPTION = 'No summary available yet.';

export const DEFAULT_RECOMMENDATION_REASON =
  'Recommended from your interest-based Google Books search.';

const INTEREST_PROFILES = new Map([
  [
    'contemporary',
    { label: 'Contemporary', aliases: ['contemporary', 'contemporary fiction'] },
  ],
  [
    'mystery',
    { label: 'Mystery', aliases: ['mystery', 'mysteries', 'detective', 'crime'] },
  ],
  [
    'romance',
    { label: 'Romance', aliases: ['romance', 'romantic', 'love story'] },
  ],
  [
    'fantasy',
    { label: 'Fantasy', aliases: ['fantasy', 'magic', 'magical'] },
  ],
  [
    'science fiction',
    {
      label: 'Sci-Fi',
      aliases: ['science fiction', 'sci fi', 'scifi', 'space opera'],
    },
  ],
  [
    'sci fi',
    {
      label: 'Sci-Fi',
      aliases: ['science fiction', 'sci fi', 'scifi', 'space opera'],
    },
  ],
  [
    'historical',
    {
      label: 'Historical',
      aliases: ['historical', 'historical fiction', 'history'],
    },
  ],
  [
    'history',
    {
      label: 'Historical',
      aliases: ['historical', 'historical fiction', 'history'],
    },
  ],
  [
    'memoir',
    { label: 'Memoir', aliases: ['memoir', 'memoirs', 'autobiography'] },
  ],
  [
    'self growth',
    {
      label: 'Self-growth',
      aliases: [
        'self growth',
        'self help',
        'self improvement',
        'personal development',
      ],
    },
  ],
  [
    'poetry',
    { label: 'Poetry', aliases: ['poetry', 'poem', 'poems'] },
  ],
  [
    'thriller',
    { label: 'Thriller', aliases: ['thriller', 'thrillers', 'suspense'] },
  ],
  [
    'nature',
    {
      label: 'Nature',
      aliases: ['nature', 'natural world', 'environment', 'wildlife'],
    },
  ],
  [
    'essays',
    { label: 'Essays', aliases: ['essay', 'essays'] },
  ],
]);

const EVIDENCE_FIELDS = [
  {
    key: 'categories',
    reasonSource: 'Google Books categories',
    score: 300,
    text: (book) => (Array.isArray(book.categories) ? book.categories.join(' ') : ''),
  },
  {
    key: 'title',
    reasonSource: 'title',
    score: 200,
    text: (book) => book.title,
  },
  {
    key: 'description',
    reasonSource: 'Google Books summary',
    score: 100,
    text: (book) =>
      book.description === MISSING_DESCRIPTION ? '' : book.description,
  },
];

function normalizeForMatching(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsWholePhrase(text, phrase) {
  if (!text || !phrase) {
    return false;
  }

  return ` ${text} `.includes(` ${phrase} `);
}

function cleanInterestLabel(value) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
}

function buildInterestProfiles(interests) {
  const profiles = [];
  const seen = new Set();

  for (const interest of interests) {
    if (typeof interest !== 'string') {
      continue;
    }

    const normalizedInterest = normalizeForMatching(interest);
    if (!normalizedInterest) {
      continue;
    }

    const knownProfile = INTEREST_PROFILES.get(normalizedInterest);
    const profileKey = knownProfile
      ? normalizeForMatching(knownProfile.label)
      : normalizedInterest;
    if (seen.has(profileKey)) {
      continue;
    }
    seen.add(profileKey);

    const aliases = new Set([
      normalizedInterest,
      ...(knownProfile?.aliases ?? []).map(normalizeForMatching),
    ]);

    profiles.push({
      aliases: [...aliases].filter(Boolean),
      label: knownProfile?.label ?? cleanInterestLabel(interest),
    });
  }

  return profiles;
}

function strongestEvidence(book, profile) {
  for (const field of EVIDENCE_FIELDS) {
    const normalizedText = normalizeForMatching(field.text(book));
    if (
      profile.aliases.some((alias) =>
        containsWholePhrase(normalizedText, alias),
      )
    ) {
      return {
        label: profile.label,
        reasonSource: field.reasonSource,
        score: field.score,
      };
    }
  }

  return null;
}

function groundedReason(evidence) {
  if (!evidence) {
    return DEFAULT_RECOMMENDATION_REASON;
  }

  return `Matches your interest in ${evidence.label} through its ${evidence.reasonSource}.`;
}

function copyBookWithReason(book, reason) {
  return {
    googleBookId: book.googleBookId,
    title: book.title,
    authors: Array.isArray(book.authors) ? [...book.authors] : [],
    description: book.description,
    thumbnail: book.thumbnail,
    categories: Array.isArray(book.categories) ? [...book.categories] : [],
    previewLink: book.previewLink,
    infoLink: book.infoLink,
    reason,
  };
}

/**
 * Local, deterministic content-based recommendation step.
 *
 * It never calls a model or foreign API, never mutates candidate books, and
 * never generates book metadata. Only the ranking and short reason are new.
 */
export function rankBookRecommendations(interests, books) {
  if (!Array.isArray(interests) || !Array.isArray(books)) {
    throw new TypeError('interests and books must both be arrays.');
  }

  const profiles = buildInterestProfiles(interests);

  return books
    .map((book, originalIndex) => {
      const evidence = profiles
        .map((profile) => strongestEvidence(book, profile))
        .filter(Boolean);
      const score = evidence.reduce((total, match) => total + match.score, 0);
      const strongestMatch = evidence.reduce(
        (strongest, match) =>
          !strongest || match.score > strongest.score ? match : strongest,
        null,
      );

      return {
        book,
        originalIndex,
        reason: groundedReason(strongestMatch),
        score,
      };
    })
    .sort((left, right) =>
      right.score - left.score || left.originalIndex - right.originalIndex,
    )
    .map(({ book, reason }) => copyBookWithReason(book, reason));
}
