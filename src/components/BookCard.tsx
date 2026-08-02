import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Book, GenreId } from '../data/books';
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from '../theme';
import { BookCover } from './BookCover';

export interface BookCardProps {
  book: Book;
  saved: boolean;
  onToggleSaved: () => void;
  cardHeight?: number;
}

const genreLabels: Record<GenreId, string> = {
  contemporary: 'Contemporary',
  mystery: 'Mystery',
  romance: 'Romance',
  fantasy: 'Fantasy',
  'science-fiction': 'Sci-Fi',
  historical: 'Historical',
  memoir: 'Memoir',
  'self-growth': 'Self-growth',
  poetry: 'Poetry',
  thriller: 'Thriller',
  nature: 'Nature',
  essays: 'Essays',
};

export function BookCard({
  book,
  saved,
  onToggleSaved,
  cardHeight,
}: BookCardProps) {
  const compact = cardHeight !== undefined && cardHeight < 580;
  const veryCompact = cardHeight !== undefined && cardHeight < 500;
  const coverHeight = cardHeight
    ? veryCompact
      ? 180
      : compact
      ? Math.max(190, Math.min(218, Math.round(cardHeight * 0.38)))
      : Math.max(218, Math.min(306, Math.round(cardHeight * 0.44)))
    : 300;
  const descriptionLines = veryCompact
    ? 1
    : compact
      ? 2
      : cardHeight && cardHeight < 620
        ? 3
        : 4;

  return (
    <View
      style={[
        styles.shadowShell,
        cardHeight !== undefined && { height: cardHeight },
      ]}
    >
      <View
        style={[
          styles.card,
          cardHeight !== undefined && styles.fixedHeightCard,
        ]}
      >
        <BookCover
          book={book}
          borderRadius={0}
          height={coverHeight}
          style={styles.cover}
        />

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={[styles.genreRow, compact && styles.genreRowCompact]}>
            {book.genres.slice(0, veryCompact ? 1 : 2).map((genre) => (
              <View key={genre} style={styles.genrePill}>
                <Text style={styles.genreLabel}>{genreLabels[genre]}</Text>
              </View>
            ))}
            <Text style={styles.year}>{book.publishedYear}</Text>
          </View>

          <Text numberOfLines={2} style={styles.title}>
            {book.title}
          </Text>
          <Text numberOfLines={1} style={styles.author}>
            by {book.author}
          </Text>

          <Text
            numberOfLines={descriptionLines}
            style={[
              styles.description,
              compact && styles.descriptionCompact,
            ]}
          >
            {book.description}
          </Text>

          <View
            style={[styles.flexSpacer, compact && styles.flexSpacerCompact]}
          />

          <View style={[styles.footer, compact && styles.footerCompact]}>
            <View
              accessibilityLabel={`${book.rating} out of 5 stars`}
              style={styles.metric}
            >
              <Ionicons
                accessibilityElementsHidden
                color={colors.amber}
                name="star"
                size={17}
              />
              <Text style={styles.metricValue}>{book.rating.toFixed(1)}</Text>
            </View>

            <View
              accessibilityLabel={`${book.pages} pages`}
              style={styles.metric}
            >
              <Ionicons
                accessibilityElementsHidden
                color={colors.inkMuted}
                name="book-outline"
                size={17}
              />
              <Text style={styles.metricValue}>{book.pages}</Text>
            </View>

            <Pressable
              accessibilityLabel={
                saved
                  ? `Remove ${book.title} from saved books`
                  : `Save ${book.title}`
              }
              accessibilityRole="button"
              accessibilityState={{ selected: saved }}
              hitSlop={8}
              onPress={onToggleSaved}
              style={({ pressed }) => [
                styles.saveButton,
                saved && styles.saveButtonActive,
                pressed && styles.saveButtonPressed,
              ]}
            >
              <Ionicons
                accessibilityElementsHidden
                color={saved ? colors.white : colors.violetDark}
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
              />
              <Text
                style={[
                  styles.saveLabel,
                  saved && styles.saveLabelActive,
                ]}
              >
                {saved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    width: '100%',
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceRaised,
    ...shadows.card,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceRaised,
  },
  fixedHeightCard: {
    flex: 1,
  },
  cover: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 28, 46, 0.08)',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  contentCompact: {
    padding: spacing.md,
  },
  genreRow: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  genreRowCompact: {
    marginBottom: spacing.xs,
  },
  genrePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.violetWash,
  },
  genreLabel: {
    ...typography.caption,
    color: colors.violetDark,
  },
  year: {
    ...typography.caption,
    marginLeft: 'auto',
    color: colors.inkSubtle,
  },
  title: {
    ...typography.heading,
    color: colors.ink,
  },
  author: {
    ...typography.label,
    marginTop: spacing.xxs,
    color: colors.inkMuted,
  },
  description: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.inkMuted,
  },
  descriptionCompact: {
    marginTop: spacing.sm,
  },
  flexSpacer: {
    flexGrow: 1,
    minHeight: spacing.md,
  },
  flexSpacerCompact: {
    minHeight: spacing.xs,
  },
  footer: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerCompact: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  metricValue: {
    ...typography.label,
    color: colors.inkMuted,
  },
  saveButton: {
    minWidth: 92,
    minHeight: 42,
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.violetWash,
  },
  saveButtonActive: {
    backgroundColor: colors.violet,
  },
  saveButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  saveLabel: {
    ...typography.label,
    color: colors.violetDark,
  },
  saveLabelActive: {
    color: colors.white,
  },
});

export default BookCard;
