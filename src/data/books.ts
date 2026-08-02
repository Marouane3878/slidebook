export type GenreId =
  | 'contemporary'
  | 'mystery'
  | 'romance'
  | 'fantasy'
  | 'science-fiction'
  | 'historical'
  | 'memoir'
  | 'self-growth'
  | 'poetry'
  | 'thriller'
  | 'nature'
  | 'essays';

export interface Interest {
  id: GenreId;
  label: string;
  emoji: string;
}

export type CoverMotif =
  | 'sun'
  | 'moon'
  | 'arch'
  | 'waves'
  | 'leaves'
  | 'stars'
  | 'grid'
  | 'rings';

export interface BookCover {
  background: string;
  accent: string;
  foreground: string;
  motif: CoverMotif;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  rating: number;
  pages: number;
  publishedYear: number;
  genres: GenreId[];
  cover: BookCover;
}

export const INTERESTS: readonly Interest[] = [
  { id: 'contemporary', label: 'Contemporary', emoji: '✨' },
  { id: 'mystery', label: 'Mystery', emoji: '🔎' },
  { id: 'romance', label: 'Romance', emoji: '💌' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉' },
  { id: 'science-fiction', label: 'Sci-Fi', emoji: '🪐' },
  { id: 'historical', label: 'Historical', emoji: '🏛️' },
  { id: 'memoir', label: 'Memoir', emoji: '🖋️' },
  { id: 'self-growth', label: 'Self-growth', emoji: '🌱' },
  { id: 'poetry', label: 'Poetry', emoji: '🌙' },
  { id: 'thriller', label: 'Thriller', emoji: '⚡' },
  { id: 'nature', label: 'Nature', emoji: '🍃' },
  { id: 'essays', label: 'Essays', emoji: '💭' },
] as const;

export const BOOKS: readonly Book[] = [
  {
    id: 'the-cartographer-of-small-weather',
    title: 'The Cartographer of Small Weather',
    author: 'Mara Venn',
    description:
      'A quiet mapmaker begins charting the moods that drift through her seaside town—and discovers one storm that belongs only to her.',
    rating: 4.8,
    pages: 336,
    publishedYear: 2025,
    genres: ['contemporary', 'fantasy'],
    cover: {
      background: '#463A71',
      accent: '#F2B86B',
      foreground: '#FFF8EA',
      motif: 'sun',
    },
  },
  {
    id: 'glasswing-hour',
    title: 'Glasswing Hour',
    author: 'Inez Bell',
    description:
      'At midnight, every window in Bellweather shows a moment from tomorrow. Two estranged sisters have one hour to change what they see.',
    rating: 4.6,
    pages: 288,
    publishedYear: 2024,
    genres: ['mystery', 'fantasy'],
    cover: {
      background: '#B85F68',
      accent: '#F6D7A7',
      foreground: '#FFF9F0',
      motif: 'moon',
    },
  },
  {
    id: 'the-last-library-at-low-tide',
    title: 'The Last Library at Low Tide',
    author: 'Theo Arden',
    description:
      'A wandering librarian rescues waterlogged stories from a vanishing coast while a developer—and an old love—threaten her final summer there.',
    rating: 4.9,
    pages: 412,
    publishedYear: 2026,
    genres: ['romance', 'contemporary', 'nature'],
    cover: {
      background: '#236B73',
      accent: '#F1C56E',
      foreground: '#F7F1E8',
      motif: 'waves',
    },
  },
  {
    id: 'instructions-for-borrowed-light',
    title: 'Instructions for Borrowed Light',
    author: 'Noor Vale',
    description:
      'Brief, luminous essays about attention, ordinary courage, and the rituals that help us find our way back to ourselves.',
    rating: 4.7,
    pages: 224,
    publishedYear: 2025,
    genres: ['essays', 'self-growth'],
    cover: {
      background: '#E8B86B',
      accent: '#6A49BD',
      foreground: '#2F2141',
      motif: 'rings',
    },
  },
  {
    id: 'night-orchard',
    title: 'Night Orchard',
    author: 'Celeste Rowan',
    description:
      'A botanist inherits an orchard that blossoms only after dark, along with a century-old bargain that is suddenly coming due.',
    rating: 4.5,
    pages: 368,
    publishedYear: 2023,
    genres: ['fantasy', 'historical', 'nature'],
    cover: {
      background: '#263F39',
      accent: '#D89EB2',
      foreground: '#F8F0DD',
      motif: 'leaves',
    },
  },
  {
    id: 'the-memory-astronaut',
    title: 'The Memory Astronaut',
    author: 'Eli Sato',
    description:
      'On a deep-space mission, an engineer receives memories from a life she never lived—and follows them toward an impossible second Earth.',
    rating: 4.4,
    pages: 392,
    publishedYear: 2026,
    genres: ['science-fiction', 'thriller'],
    cover: {
      background: '#191D45',
      accent: '#A78BFA',
      foreground: '#F7F3FF',
      motif: 'stars',
    },
  },
  {
    id: 'a-house-made-of-sundays',
    title: 'A House Made of Sundays',
    author: 'June Delacroix',
    description:
      'Four generations return to the family home for one last meal, each carrying a secret that could redraw their shared past.',
    rating: 4.6,
    pages: 304,
    publishedYear: 2024,
    genres: ['contemporary', 'historical'],
    cover: {
      background: '#D98965',
      accent: '#5A315F',
      foreground: '#FFF8ED',
      motif: 'arch',
    },
  },
  {
    id: 'where-the-bluebells-listen',
    title: 'Where the Bluebells Listen',
    author: 'Amaya Hart',
    description:
      'Tender poems tracing migration, family folklore, and the small landscapes we carry with us long after leaving home.',
    rating: 4.8,
    pages: 176,
    publishedYear: 2025,
    genres: ['poetry', 'memoir'],
    cover: {
      background: '#7567A8',
      accent: '#C8D8B4',
      foreground: '#FFFDF5',
      motif: 'grid',
    },
  },
] as const;

export function getBookById(bookId: string): Book | undefined {
  return BOOKS.find((book) => book.id === bookId);
}
