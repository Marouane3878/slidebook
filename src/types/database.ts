import type { Timestamp } from 'firebase/firestore';

import type { GenreId } from '../data/books';

export const COLLECTIONS = {
  users: 'users',
  userInterests: 'userInterests',
  savedBooks: 'savedBooks',
  bookRecommendations: 'bookRecommendations',
  profiles: 'profiles',
  // Reserved for later versions. Client access is denied in firestore.rules.
  posts: 'posts',
  followers: 'followers',
  authorProfiles: 'authorProfiles',
} as const;

export interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string;
  createdAt: Timestamp;
  isPremium: boolean;
}

export interface UserInterestsDocument {
  userId: string;
  interests: GenreId[];
}

export interface SavedBookDocument {
  userId: string;
  googleBookId: string;
  title: string;
  author: string;
  coverUrl: string;
  savedAt: Timestamp;
}

/** Fields the client supplies when creating or removing a saved book. */
export type SaveableBook = Pick<
  SavedBookDocument,
  'googleBookId' | 'title' | 'author' | 'coverUrl'
>;

/** Reserved recommendation cache; v1 recommendations come from the backend. */
export interface BookRecommendationsDocument {
  userId: string;
  googleBookIds: string[];
  generatedAt: Timestamp;
}

/** Lightweight profile data, kept separate from private account data. */
export interface ProfileDocument {
  userId: string;
  displayName: string;
  photoUrl: string;
  bio: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
