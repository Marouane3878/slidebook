import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BookCard } from '../../components/BookCard';
import { LibrarySyncNotice } from '../../components/LibrarySyncNotice';
import { LogoMark } from '../../components/LogoMark';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useLibrary } from '../../context/LibraryContext';
import { INTERESTS } from '../../data/books';
import { useBookRecommendations } from '../../hooks/useBookRecommendations';
import { colors, radii, spacing, typography } from '../../theme';
import type { SaveableBook } from '../../types/database';
import type { BookRecommendation } from '../../types/recommendations';

function saveableBook(book: BookRecommendation): SaveableBook {
  return {
    author: book.authors.join(', ').slice(0, 300),
    coverUrl: (book.thumbnail ?? '').slice(0, 2048),
    googleBookId: book.googleBookId.slice(0, 256),
    title: book.title.slice(0, 300),
  };
}

interface FeedStatusProps {
  actionLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
  message: string;
  onAction: () => void;
  title: string;
}

function FeedStatus({
  actionLabel,
  icon,
  isLoading = false,
  message,
  onAction,
  title,
}: FeedStatusProps) {
  return (
    <View style={styles.statusPanel}>
      <View style={styles.statusIcon}>
        {isLoading ? (
          <ActivityIndicator color={colors.violet} size="small" />
        ) : (
          <Ionicons color={colors.violet} name={icon} size={28} />
        )}
      </View>
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={styles.statusMessage}>{message}</Text>
      {!isLoading ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          style={styles.statusButton}
        />
      ) : null}
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const {
    displayName,
    isLibraryLoading,
    isSaved,
    selectedInterests,
    toggleSaved,
  } = useLibrary();
  const { books, error, isLoading, refresh } = useBookRecommendations(
    selectedInterests,
    !isLibraryLoading,
  );
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [listHeight, setListHeight] = useState(0);

  const fallbackCardHeight = Math.min(Math.max(height - 250, 448), 620);
  const cardHeight = listHeight
    ? Math.max(listHeight - spacing.md, 448)
    : fallbackCardHeight;
  const snapInterval = cardHeight + spacing.md;
  const snapEnabled =
    Platform.OS !== 'web' && listHeight >= cardHeight + spacing.md;
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'R';
  const interestLabels = useMemo(
    () =>
      selectedInterests.map(
        (interestId) =>
          INTERESTS.find((interest) => interest.id === interestId)?.label ??
          interestId,
      ),
    [selectedInterests],
  );
  const bookKey = books.map((book) => book.googleBookId).join('\u001f');

  useEffect(() => {
    setVisibleIndex(0);
  }, [bookKey]);

  const trackVisibleCard = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.y / snapInterval,
    );
    setVisibleIndex(Math.max(0, Math.min(nextIndex, books.length - 1)));
  };

  const measureList = (event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (Math.abs(nextHeight - listHeight) > 1) {
      setListHeight(nextHeight);
    }
  };

  const renderBook = ({ item }: { item: BookRecommendation }) => (
    <View style={styles.cardFrame}>
      <BookCard
        book={item}
        cardHeight={cardHeight}
        onToggleSaved={() => toggleSaved(saveableBook(item))}
        saved={isSaved(item.googleBookId)}
      />
    </View>
  );

  const showLoading = isLibraryLoading || isLoading;

  return (
    <Screen padded={false}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <View style={styles.wordmarkRow}>
              <LogoMark size={28} style={styles.miniMark} />
              <Text style={styles.wordmark}>slidebook</Text>
            </View>
            <Text style={styles.heading}>Find your next story.</Text>
          </View>
          <Pressable
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>

        <View style={styles.interestRow}>
          <ScrollView
            contentContainerStyle={styles.interests}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={[styles.interestPill, styles.interestPillSelected]}>
              <Ionicons color={colors.white} name="sparkles" size={14} />
              <Text style={[styles.interestText, styles.interestTextSelected]}>
                For you
              </Text>
            </View>
            {interestLabels.map((interest) => (
              <View key={interest} style={styles.interestPill}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {books.length ? visibleIndex + 1 : 0}/{books.length}
            </Text>
          </View>
        </View>

        <LibrarySyncNotice style={styles.syncNotice} />

        <View onLayout={measureList} style={styles.listArea}>
          {showLoading ? (
            <FeedStatus
              actionLabel=""
              icon="sparkles-outline"
              isLoading
              message="Searching Google Books using your reading interests."
              onAction={() => undefined}
              title="Building your recommendations…"
            />
          ) : selectedInterests.length === 0 ? (
            <FeedStatus
              actionLabel="Choose interests"
              icon="options-outline"
              message="Choose a few genres so Slidebook knows what to recommend."
              onAction={() => router.push('/interests')}
              title="Tell us what you love."
            />
          ) : error ? (
            <FeedStatus
              actionLabel="Try again"
              icon="cloud-offline-outline"
              message={error}
              onAction={refresh}
              title="Recommendations took a detour."
            />
          ) : books.length === 0 ? (
            <FeedStatus
              actionLabel="Refresh"
              icon="search-outline"
              message="No matching books appeared this time. Try refreshing or adjust your interests."
              onAction={refresh}
              title="No books found yet."
            />
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={books}
              decelerationRate={snapEnabled ? 'fast' : 'normal'}
              getItemLayout={(_, index) => ({
                index,
                length: snapInterval,
                offset: snapInterval * index,
              })}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              key={selectedInterests.join(',')}
              keyExtractor={(book) => book.googleBookId}
              onMomentumScrollEnd={trackVisibleCard}
              onScroll={Platform.OS === 'web' ? trackVisibleCard : undefined}
              renderItem={renderBook}
              scrollEventThrottle={Platform.OS === 'web' ? 32 : undefined}
              showsVerticalScrollIndicator={false}
              snapToAlignment={snapEnabled ? 'start' : undefined}
              snapToInterval={snapEnabled ? snapInterval : undefined}
              windowSize={3}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 620,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
  },
  wordmarkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  miniMark: {
    transform: [{ rotate: '-4deg' }],
  },
  wordmark: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heading: {
    ...typography.heading,
    color: colors.ink,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderColor: colors.surfaceRaised,
    borderRadius: 23,
    borderWidth: 3,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  avatarText: {
    color: colors.violetDark,
    fontSize: 13,
    fontWeight: '800',
  },
  interestRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    maxWidth: 620,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingTop: spacing.md,
    width: '100%',
  },
  interests: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  interestPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  interestPillSelected: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  interestText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  interestTextSelected: {
    color: colors.white,
  },
  counter: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: spacing.lg,
    minHeight: 32,
    minWidth: 48,
    paddingHorizontal: spacing.xs,
  },
  counterText: {
    color: colors.inkMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  syncNotice: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
    maxWidth: 572,
    width: '100%',
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  cardFrame: {
    alignSelf: 'center',
    maxWidth: 560,
    width: '100%',
  },
  separator: {
    height: spacing.md,
  },
  statusPanel: {
    alignItems: 'center',
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 420,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: 28,
    height: 58,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 58,
  },
  statusTitle: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'center',
  },
  statusMessage: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statusButton: {
    marginTop: spacing.lg,
    maxWidth: 240,
  },
  pressed: {
    opacity: 0.7,
  },
});
