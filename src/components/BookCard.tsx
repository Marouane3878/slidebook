import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  NO_SUMMARY_AVAILABLE,
  RECOMMENDATION_REASON_UNAVAILABLE,
  type BookRecommendation,
} from '../types/recommendations';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { BookThumbnail } from './BookThumbnail';

export interface BookCardProps {
  book: BookRecommendation;
  saved: boolean;
  onToggleSaved: () => void;
  cardHeight?: number;
}

function openBookLink(url: string | null): void {
  if (url) {
    void Linking.openURL(url).catch(() => {
      // The link is optional metadata; a platform refusal should not crash UI.
    });
  }
}

export function BookCard({
  book,
  saved,
  onToggleSaved,
  cardHeight,
}: BookCardProps) {
  const compact = cardHeight !== undefined && cardHeight < 580;
  const veryCompact = cardHeight !== undefined && cardHeight < 500;
  const heroHeight = cardHeight
    ? veryCompact
      ? Math.max(156, Math.min(178, Math.round(cardHeight * 0.35)))
      : compact
        ? Math.max(190, Math.min(220, Math.round(cardHeight * 0.39)))
        : Math.max(220, Math.min(280, Math.round(cardHeight * 0.43)))
    : 270;
  const thumbnailHeight = Math.max(150, heroHeight - spacing.lg);
  const thumbnailWidth = Math.round(thumbnailHeight * 0.67);
  const descriptionLines = veryCompact ? 1 : compact ? 1 : 3;
  const reasonLines = veryCompact ? 1 : 2;
  const authorLabel = book.authors.length
    ? book.authors.join(', ')
    : 'Author not listed';
  const externalLink = book.previewLink ?? book.infoLink;

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
        <View style={[styles.coverHero, { height: heroHeight }]}>
          <View style={styles.coverGlow} />
          <View style={styles.thumbnailShadow}>
            <BookThumbnail
              author={authorLabel}
              borderRadius={radii.sm}
              height={thumbnailHeight}
              thumbnail={book.thumbnail}
              title={book.title}
              width={thumbnailWidth}
            />
          </View>
        </View>

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={[styles.categoryRow, compact && styles.categoryRowCompact]}>
            {(book.categories.length ? book.categories : ['Recommended'])
              .slice(0, veryCompact ? 1 : 2)
              .map((category) => (
                <View key={category} style={styles.categoryPill}>
                  <Text numberOfLines={1} style={styles.categoryLabel}>
                    {category}
                  </Text>
                </View>
              ))}
          </View>

          <Text numberOfLines={2} style={styles.title}>
            {book.title}
          </Text>
          <Text numberOfLines={1} style={styles.author}>
            by {authorLabel}
          </Text>

          <View style={styles.reasonRow}>
            <Ionicons color={colors.violet} name="sparkles" size={15} />
            <Text numberOfLines={reasonLines} style={styles.reasonText}>
              {book.reason.trim() || RECOMMENDATION_REASON_UNAVAILABLE}
            </Text>
          </View>

          <Text
            numberOfLines={descriptionLines}
            style={[styles.description, compact && styles.descriptionCompact]}
          >
            {book.description.trim() || NO_SUMMARY_AVAILABLE}
          </Text>

          <View style={styles.flexSpacer} />

          <View style={[styles.footer, compact && styles.footerCompact]}>
            {externalLink ? (
              <Pressable
                accessibilityLabel={`Open ${book.title} on Google Books`}
                accessibilityRole="link"
                onPress={() => openBookLink(externalLink)}
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  color={colors.inkMuted}
                  name="open-outline"
                  size={17}
                />
                <Text style={styles.linkLabel}>
                  {book.previewLink ? 'Preview' : 'Details'}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.noPreview}>Preview unavailable</Text>
            )}

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
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                color={saved ? colors.white : colors.violetDark}
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
              />
              <Text style={[styles.saveLabel, saved && styles.saveLabelActive]}>
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
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.xl,
    width: '100%',
    ...shadows.card,
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fixedHeightCard: {
    flex: 1,
  },
  coverHero: {
    alignItems: 'center',
    backgroundColor: colors.violetWash,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverGlow: {
    backgroundColor: colors.blush,
    borderRadius: 160,
    height: 280,
    opacity: 0.32,
    position: 'absolute',
    right: -72,
    top: -110,
    width: 280,
  },
  thumbnailShadow: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    shadowColor: colors.ink,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  contentCompact: {
    padding: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    minHeight: 25,
    overflow: 'hidden',
  },
  categoryRowCompact: {
    marginBottom: spacing.xs,
  },
  categoryPill: {
    backgroundColor: colors.violetWash,
    borderRadius: radii.pill,
    flexShrink: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.violetDark,
  },
  title: {
    ...typography.heading,
    color: colors.ink,
  },
  author: {
    ...typography.label,
    color: colors.inkMuted,
    marginTop: spacing.xxs,
  },
  description: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.md,
  },
  descriptionCompact: {
    marginTop: spacing.sm,
  },
  reasonRow: {
    alignItems: 'flex-start',
    backgroundColor: colors.violetWash,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  reasonText: {
    ...typography.caption,
    color: colors.violetDark,
    flex: 1,
  },
  flexSpacer: {
    flexGrow: 1,
    minHeight: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingTop: spacing.md,
  },
  footerCompact: {
    paddingTop: spacing.sm,
  },
  linkButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 42,
    paddingHorizontal: spacing.xs,
  },
  linkLabel: {
    ...typography.label,
    color: colors.inkMuted,
  },
  noPreview: {
    ...typography.caption,
    color: colors.inkSubtle,
    flex: 1,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.violetWash,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginLeft: 'auto',
    minHeight: 42,
    minWidth: 92,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveButtonActive: {
    backgroundColor: colors.violet,
  },
  buttonPressed: {
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
