import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BookThumbnail } from '../../components/BookThumbnail';
import { LibrarySyncNotice } from '../../components/LibrarySyncNotice';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useLibrary } from '../../context/LibraryContext';
import type { SaveableBook, SavedBookDocument } from '../../types/database';
import { colors, radii, shadows, spacing, typography } from '../../theme';

function SavedBook({
  book,
  coverHeight,
  onRemove,
}: {
  book: SavedBookDocument;
  coverHeight: number;
  onRemove: () => void;
}) {
  return (
    <View style={styles.savedItem}>
      <View style={styles.coverShell}>
        <BookThumbnail
          author={book.author || undefined}
          borderRadius={radii.lg}
          height={coverHeight}
          style={styles.cover}
          thumbnail={book.coverUrl || null}
          title={book.title}
        />
        <Pressable
          accessibilityLabel={`Remove ${book.title} from saved books`}
          accessibilityRole="button"
          hitSlop={6}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons color={colors.violetDark} name="bookmark" size={17} />
        </Pressable>
      </View>
      <Text numberOfLines={2} style={styles.bookTitle}>
        {book.title}
      </Text>
      <Text numberOfLines={1} style={styles.bookAuthor}>
        {book.author || 'Author not listed'}
      </Text>
      <View style={styles.bookMeta}>
        <Ionicons color={colors.violet} name="bookmark-outline" size={13} />
        <Text style={styles.bookMetaText}>Saved to your shelf</Text>
      </View>
    </View>
  );
}

function EmptySaved({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyBackBook} />
        <View style={styles.emptyFrontBook}>
          <Ionicons color={colors.violet} name="bookmark-outline" size={36} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Your shelf is ready.</Text>
      <Text style={styles.emptyCopy}>
        Save any book that catches your eye and it’ll wait for you here.
      </Text>
      <PrimaryButton
        icon="sparkles-outline"
        label="Explore books"
        onPress={onExplore}
        style={styles.emptyButton}
      />
    </View>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { savedBooks, toggleSaved } = useLibrary();
  const contentWidth = Math.min(width, 520);
  const bookWidth = (contentWidth - spacing.lg * 2 - spacing.md) / 2;
  const coverHeight = Math.round(
    Math.max(210, Math.min(300, bookWidth * 1.42)),
  );

  return (
    <Screen padded={false}>
      <FlatList
        columnWrapperStyle={
          savedBooks.length > 0 ? styles.columnWrapper : undefined
        }
        contentContainerStyle={[
          styles.listContent,
          savedBooks.length === 0 && styles.listContentEmpty,
        ]}
        data={savedBooks}
        keyExtractor={(book) => book.googleBookId}
        ListEmptyComponent={
          <EmptySaved onExplore={() => router.push('/feed')} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons color={colors.violet} name="bookmark" size={21} />
            </View>
            <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
            <Text style={styles.title}>Saved for later.</Text>
            <Text style={styles.subtitle}>
              {savedBooks.length === 0
                ? 'A quiet place for books you want to remember.'
                : `${savedBooks.length} ${savedBooks.length === 1 ? 'book' : 'books'} waiting on your shelf.`}
            </Text>
            <LibrarySyncNotice style={styles.syncNotice} />
          </View>
        }
        numColumns={2}
        renderItem={({ item }) => (
          <SavedBook
            book={item}
            coverHeight={coverHeight}
            onRemove={() =>
              toggleSaved({
                author: item.author,
                coverUrl: item.coverUrl,
                googleBookId: item.googleBookId,
                title: item.title,
              } satisfies SaveableBook)
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    alignSelf: 'center',
    maxWidth: 520,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  syncNotice: {
    marginTop: spacing.md,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 42,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.violet,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  savedItem: {
    flex: 1,
    marginBottom: spacing.lg,
    maxWidth: '48%',
    minWidth: 0,
  },
  coverShell: {
    ...shadows.card,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    position: 'relative',
  },
  cover: {
    borderColor: 'rgba(37, 28, 46, 0.08)',
    borderWidth: 1,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,253,248,0.94)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 36,
  },
  bookTitle: {
    ...typography.label,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  bookAuthor: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  bookMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  bookMetaText: {
    color: colors.inkSubtle,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyArt: {
    height: 130,
    marginBottom: spacing.lg,
    position: 'relative',
    width: 130,
  },
  emptyBackBook: {
    backgroundColor: colors.blush,
    borderRadius: 20,
    height: 92,
    left: 18,
    position: 'absolute',
    top: 17,
    transform: [{ rotate: '-9deg' }],
    width: 76,
  },
  emptyFrontBook: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderColor: colors.surfaceRaised,
    borderRadius: 20,
    borderWidth: 2,
    height: 96,
    justifyContent: 'center',
    position: 'absolute',
    right: 17,
    top: 21,
    transform: [{ rotate: '6deg' }],
    width: 78,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyCopy: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    maxWidth: 340,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.lg,
    maxWidth: 260,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
