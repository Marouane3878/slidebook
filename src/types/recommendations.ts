export const NO_SUMMARY_AVAILABLE = 'No summary available yet.';
export const RECOMMENDATION_REASON_UNAVAILABLE =
  'Recommendation reason unavailable.';

/** The public book shape returned by the Slidebook recommendation backend. */
export interface BookRecommendation {
  googleBookId: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail: string | null;
  categories: string[];
  previewLink: string | null;
  infoLink: string | null;
  reason: string;
}

export interface BookRecommendationsResponse {
  books: BookRecommendation[];
}
