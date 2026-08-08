import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { LogoMark } from '../components/LogoMark';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { colors, radii, shadows, spacing, typography } from '../theme';

function Wordmark() {
  return (
    <View style={styles.wordmark}>
      <LogoMark size={38} style={styles.logoMark} />
      <Text style={styles.logoText}>slidebook</Text>
    </View>
  );
}

function BookStack() {
  const { width } = useWindowDimensions();
  const artScale = Math.min(1, Math.max(0.78, (width - spacing.lg * 2) / 310));

  return (
    <View style={[styles.heroArtFrame, { height: 300 * artScale }]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.heroArt, { transform: [{ scale: artScale }] }]}
      >
        <View style={styles.heroHalo} />
        <View style={[styles.backBook, styles.backBookLeft]} />
        <View style={[styles.backBook, styles.backBookRight]} />
        <View style={styles.frontBook}>
          <View style={styles.coverTopRow}>
            <Text style={styles.coverEyebrow}>A NOVEL</Text>
            <View style={styles.coverStar}>
              <Ionicons color={colors.violetDark} name="sparkles" size={13} />
            </View>
          </View>
          <View style={styles.coverOrbit}>
            <View style={styles.coverMoon} />
            <View style={styles.coverDot} />
          </View>
          <Text style={styles.coverTitle}>THE QUIET{'\n'}BETWEEN{'\n'}STARS</Text>
          <Text style={styles.coverAuthor}>MARA VOSS</Text>
        </View>
        <View style={styles.swipeHint}>
          <Ionicons color={colors.violet} name="swap-horizontal" size={16} />
          <Text style={styles.swipeHintText}>Swipe. Save. Read.</Text>
        </View>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={styles.screenContent} scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Wordmark />
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() =>
              router.push({ pathname: '/auth', params: { mode: 'login' } })
            }
            style={({ pressed }) => [
              styles.headerLogin,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.headerLoginText}>Log in</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <BookStack />
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>BOOK DISCOVERY, REIMAGINED</Text>
            <Text style={styles.title}>Your next favorite book is one swipe away.</Text>
            <Text style={styles.subtitle}>
              Personal picks, delightful covers, and a reading list that finally
              feels like yours.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            icon="arrow-forward"
            label="Start discovering"
            onPress={() =>
              router.push({ pathname: '/auth', params: { mode: 'signup' } })
            }
          />
          <Text style={styles.footnote}>
            Join a calmer, more personal way to find books.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  container: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 560,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wordmark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logoMark: {
    transform: [{ rotate: '-4deg' }],
  },
  logoText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerLogin: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  headerLoginText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  heroArtFrame: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  heroArt: {
    height: 300,
    left: '50%',
    marginLeft: -155,
    position: 'relative',
    width: 310,
  },
  heroHalo: {
    backgroundColor: colors.violetSoft,
    borderRadius: 128,
    height: 256,
    left: 27,
    opacity: 0.84,
    position: 'absolute',
    top: 16,
    width: 256,
  },
  backBook: {
    borderRadius: 22,
    height: 218,
    left: 70,
    position: 'absolute',
    top: 26,
    width: 164,
  },
  backBookLeft: {
    backgroundColor: colors.blush,
    transform: [{ rotate: '-10deg' }, { translateX: -14 }],
  },
  backBookRight: {
    backgroundColor: colors.sage,
    transform: [{ rotate: '9deg' }, { translateX: 16 }],
  },
  frontBook: {
    ...shadows.floating,
    backgroundColor: colors.violetDark,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 22,
    borderWidth: 1,
    height: 230,
    left: 73,
    overflow: 'hidden',
    padding: 18,
    position: 'absolute',
    top: 24,
    transform: [{ rotate: '-1deg' }],
    width: 164,
  },
  coverTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverEyebrow: {
    color: '#F8E7CA',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  coverStar: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  coverOrbit: {
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 42,
    borderWidth: 1,
    height: 62,
    marginTop: 10,
    position: 'relative',
    width: 62,
  },
  coverMoon: {
    backgroundColor: colors.blush,
    borderRadius: 21,
    height: 42,
    left: 9,
    position: 'absolute',
    top: 9,
    width: 42,
  },
  coverDot: {
    backgroundColor: colors.amber,
    borderRadius: 5,
    height: 10,
    position: 'absolute',
    right: -5,
    top: 10,
    width: 10,
  },
  coverTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.25,
    lineHeight: 17,
    marginTop: 11,
  },
  coverAuthor: {
    color: '#F8E7CA',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
  },
  swipeHint: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    bottom: 3,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    position: 'absolute',
    ...shadows.card,
  },
  swipeHintText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  copy: {
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.caption,
    color: colors.violet,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    fontSize: 38,
    lineHeight: 42,
    maxWidth: 500,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.md,
    maxWidth: 430,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  footnote: {
    ...typography.caption,
    color: colors.inkSubtle,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.68,
  },
});
