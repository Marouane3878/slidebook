import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BookCard } from '../../components/BookCard';
import { Screen } from '../../components/Screen';
import { useLibrary } from '../../context/LibraryContext';
import { BOOKS, type Book } from '../../data/books';
import { colors, radii, spacing, typography } from '../../theme';

type FeedFilter = 'For you' | 'Quick reads' | 'New & notable';

const FILTERS: FeedFilter[] = ['For you', 'Quick reads', 'New & notable'];

export default function FeedScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { displayName, isSaved, selectedInterests, toggleSaved } = useLibrary();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('For you');
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

  const books = useMemo(() => {
    const items = [...BOOKS];

    if (activeFilter === 'Quick reads') {
      return items.sort((a, b) => a.pages - b.pages);
    }
    if (activeFilter === 'New & notable') {
      return items.sort(
        (a, b) => b.publishedYear - a.publishedYear || b.rating - a.rating,
      );
    }

    return items.sort((a, b) => {
      const aMatches = a.genres.filter((genre) =>
        selectedInterests.includes(genre),
      ).length;
      const bMatches = b.genres.filter((genre) =>
        selectedInterests.includes(genre),
      ).length;
      return bMatches - aMatches || b.rating - a.rating;
    });
  }, [activeFilter, selectedInterests]);

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

  const renderBook = ({ item }: { item: Book }) => (
    <View style={styles.cardFrame}>
      <BookCard
        book={item}
        cardHeight={cardHeight}
        onToggleSaved={() => toggleSaved(item.id)}
        saved={isSaved(item.id)}
      />
    </View>
  );

  return (
    <Screen padded={false}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <View style={styles.wordmarkRow}>
              <View style={styles.miniMark}>
                <Ionicons color={colors.white} name="book-outline" size={15} />
              </View>
              <Text style={styles.wordmark}>slidebook</Text>
            </View>
            <Text style={styles.heading}>Find your next story.</Text>
          </View>
          <Pressable
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <ScrollView
            contentContainerStyle={styles.filters}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {FILTERS.map((filter) => {
              const selected = filter === activeFilter;

              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={filter}
                  onPress={() => {
                    setActiveFilter(filter);
                    setVisibleIndex(0);
                  }}
                  style={({ pressed }) => [
                    styles.filter,
                    selected && styles.filterSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  {selected ? (
                    <Ionicons color={colors.white} name="sparkles" size={14} />
                  ) : null}
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {visibleIndex + 1}/{books.length}
            </Text>
          </View>
        </View>

        <View onLayout={measureList} style={styles.listArea}>
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
            key={activeFilter}
            keyExtractor={(book) => book.id}
            onMomentumScrollEnd={trackVisibleCard}
            onScroll={Platform.OS === 'web' ? trackVisibleCard : undefined}
            renderItem={renderBook}
            scrollEventThrottle={Platform.OS === 'web' ? 32 : undefined}
            showsVerticalScrollIndicator={false}
            snapToAlignment={snapEnabled ? 'start' : undefined}
            snapToInterval={snapEnabled ? snapInterval : undefined}
            windowSize={3}
          />
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
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderRadius: 9,
    height: 28,
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
    width: 28,
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
  filterRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    maxWidth: 620,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingTop: spacing.md,
    width: '100%',
  },
  filters: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filter: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  filterSelected: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  filterText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextSelected: {
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
    minWidth: 44,
    paddingHorizontal: spacing.xs,
  },
  counterText: {
    color: colors.inkMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  listArea: {
    flex: 1,
  },
  cardFrame: {
    alignSelf: 'center',
    maxWidth: 560,
    width: '100%',
  },
  separator: {
    height: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
