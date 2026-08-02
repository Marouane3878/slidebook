import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Book, CoverMotif } from '../data/books';
import { radii, spacing, typography } from '../theme';

export interface BookCoverProps {
  book: Pick<Book, 'title' | 'author' | 'cover'>;
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

interface MotifProps {
  motif: CoverMotif;
  background: string;
  accent: string;
  foreground: string;
}

function Motif({ motif, background, accent, foreground }: MotifProps) {
  if (motif === 'sun') {
    return (
      <View pointerEvents="none" style={styles.motifLayer}>
        <View style={[styles.sunRayHorizontal, { backgroundColor: accent }]} />
        <View style={[styles.sunRayVertical, { backgroundColor: accent }]} />
        <View style={[styles.sun, { backgroundColor: accent }]} />
        <View style={[styles.sunCore, { borderColor: foreground }]} />
      </View>
    );
  }

  if (motif === 'moon') {
    return (
      <View pointerEvents="none" style={styles.motifLayer}>
        <View style={[styles.moon, { backgroundColor: accent }]} />
        <View
          style={[styles.moonCutout, { backgroundColor: background }]}
        />
        <View style={[styles.starDotLarge, { backgroundColor: foreground }]} />
        <View style={[styles.starDotSmall, { backgroundColor: foreground }]} />
      </View>
    );
  }

  if (motif === 'arch') {
    return (
      <View pointerEvents="none" style={styles.motifLayer}>
        <View style={[styles.archOuter, { backgroundColor: accent }]}>
          <View
            style={[styles.archInner, { backgroundColor: background }]}
          />
        </View>
        <View style={[styles.archSun, { backgroundColor: foreground }]} />
      </View>
    );
  }

  if (motif === 'waves') {
    return (
      <View pointerEvents="none" style={styles.motifLayer}>
        <View style={[styles.wave, styles.waveOne, { borderColor: accent }]} />
        <View
          style={[styles.wave, styles.waveTwo, { borderColor: foreground }]}
        />
        <View style={[styles.wave, styles.waveThree, { borderColor: accent }]} />
      </View>
    );
  }

  if (motif === 'leaves') {
    return (
      <View pointerEvents="none" style={styles.motifLayer}>
        <View style={[styles.leafStem, { backgroundColor: accent }]} />
        <View
          style={[styles.leaf, styles.leafOne, { backgroundColor: accent }]}
        />
        <View
          style={[styles.leaf, styles.leafTwo, { backgroundColor: foreground }]}
        />
        <View
          style={[styles.leaf, styles.leafThree, { backgroundColor: accent }]}
        />
        <View
          style={[styles.leaf, styles.leafFour, { backgroundColor: foreground }]}
        />
      </View>
    );
  }

  if (motif === 'stars') {
    return (
      <View pointerEvents="none" style={styles.motifLayer}>
        <View style={[styles.orbit, { borderColor: accent }]} />
        <View style={[styles.planet, { backgroundColor: accent }]} />
        <View
          style={[styles.spaceStar, styles.spaceStarOne, { backgroundColor: foreground }]}
        />
        <View
          style={[styles.spaceStar, styles.spaceStarTwo, { backgroundColor: foreground }]}
        />
        <View
          style={[styles.spaceStar, styles.spaceStarThree, { backgroundColor: accent }]}
        />
      </View>
    );
  }

  if (motif === 'grid') {
    return (
      <View pointerEvents="none" style={styles.motifLayer}>
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((line) => (
            <View
              key={`vertical-${line}`}
              style={[
                styles.gridVertical,
                { left: line * 42, backgroundColor: accent },
              ]}
            />
          ))}
          {[0, 1, 2, 3].map((line) => (
            <View
              key={`horizontal-${line}`}
              style={[
                styles.gridHorizontal,
                { top: line * 42, backgroundColor: accent },
              ]}
            />
          ))}
          <View style={[styles.gridDot, { backgroundColor: foreground }]} />
        </View>
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.motifLayer}>
      <View style={[styles.ring, styles.ringOuter, { borderColor: accent }]} />
      <View
        style={[styles.ring, styles.ringMiddle, { borderColor: foreground }]}
      />
      <View style={[styles.ring, styles.ringInner, { borderColor: accent }]} />
    </View>
  );
}

export function BookCover({
  book,
  width,
  height = 300,
  borderRadius = radii.lg,
  style,
}: BookCoverProps) {
  const compact = (width !== undefined && width < 180) || height < 230;

  return (
    <View
      accessibilityLabel={`Cover of ${book.title} by ${book.author}`}
      accessibilityRole="image"
      style={[
        styles.cover,
        {
          width: width ?? '100%',
          height,
          borderRadius,
          backgroundColor: book.cover.background,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.spine, { backgroundColor: book.cover.accent }]}
      />
      <Motif
        accent={book.cover.accent}
        background={book.cover.background}
        foreground={book.cover.foreground}
        motif={book.cover.motif}
      />
      <View pointerEvents="none" style={styles.coverWash} />

      <View style={[styles.copy, compact && styles.copyCompact]}>
        {!compact ? (
          <Text
            style={[styles.imprint, { color: book.cover.foreground }]}
            accessible={false}
          >
            SLIDEBOOK EDITIONS
          </Text>
        ) : null}
        <View
          style={[
            styles.rule,
            compact && styles.ruleCompact,
            { backgroundColor: book.cover.accent },
          ]}
        />
        <Text
          numberOfLines={compact ? 3 : 4}
          style={[
            styles.title,
            compact && styles.titleCompact,
            { color: book.cover.foreground },
          ]}
        >
          {book.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.author,
            compact && styles.authorCompact,
            { color: book.cover.foreground },
          ]}
        >
          {book.author}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: 'relative',
    overflow: 'hidden',
  },
  spine: {
    position: 'absolute',
    zIndex: 3,
    top: 0,
    bottom: 0,
    left: 0,
    width: 8,
    opacity: 0.82,
  },
  coverWash: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  motifLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    overflow: 'hidden',
  },
  copy: {
    position: 'absolute',
    zIndex: 4,
    right: spacing.lg,
    bottom: spacing.lg,
    left: spacing.lg + 4,
  },
  copyCompact: {
    right: spacing.md,
    bottom: spacing.md,
    left: spacing.md + 2,
  },
  imprint: {
    ...typography.caption,
    marginBottom: spacing.sm,
    opacity: 0.76,
    letterSpacing: 1.5,
  },
  rule: {
    width: 36,
    height: 4,
    marginBottom: spacing.sm,
    borderRadius: radii.pill,
  },
  ruleCompact: {
    width: 24,
    height: 3,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.65,
    textShadowColor: 'rgba(0, 0, 0, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  titleCompact: {
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: -0.25,
  },
  author: {
    ...typography.label,
    marginTop: spacing.sm,
    opacity: 0.88,
  },
  authorCompact: {
    marginTop: spacing.xs,
    fontSize: 11,
    lineHeight: 14,
  },
  sun: {
    position: 'absolute',
    top: 36,
    right: 30,
    width: 138,
    height: 138,
    borderRadius: 69,
    opacity: 0.9,
  },
  sunCore: {
    position: 'absolute',
    top: 52,
    right: 46,
    width: 106,
    height: 106,
    borderWidth: 1,
    borderRadius: 53,
    opacity: 0.68,
  },
  sunRayHorizontal: {
    position: 'absolute',
    top: 103,
    right: -8,
    width: 214,
    height: 2,
    opacity: 0.54,
  },
  sunRayVertical: {
    position: 'absolute',
    top: 0,
    right: 98,
    width: 2,
    height: 206,
    opacity: 0.54,
  },
  moon: {
    position: 'absolute',
    top: 30,
    right: 34,
    width: 142,
    height: 142,
    borderRadius: 71,
  },
  moonCutout: {
    position: 'absolute',
    top: 12,
    right: 10,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  starDotLarge: {
    position: 'absolute',
    top: 48,
    left: 46,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  starDotSmall: {
    position: 'absolute',
    top: 95,
    left: 78,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  archOuter: {
    position: 'absolute',
    top: 18,
    right: 28,
    width: 154,
    height: 190,
    padding: 15,
    borderTopLeftRadius: 77,
    borderTopRightRadius: 77,
  },
  archInner: {
    flex: 1,
    borderTopLeftRadius: 62,
    borderTopRightRadius: 62,
  },
  archSun: {
    position: 'absolute',
    top: 70,
    right: 72,
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  wave: {
    position: 'absolute',
    right: -30,
    width: 260,
    height: 92,
    borderWidth: 4,
    borderRadius: 130,
    opacity: 0.74,
  },
  waveOne: {
    top: -22,
  },
  waveTwo: {
    top: 24,
  },
  waveThree: {
    top: 70,
  },
  leafStem: {
    position: 'absolute',
    top: 16,
    right: 105,
    width: 3,
    height: 194,
    borderRadius: 2,
    transform: [{ rotate: '18deg' }],
  },
  leaf: {
    position: 'absolute',
    width: 58,
    height: 30,
    borderTopLeftRadius: 30,
    borderBottomRightRadius: 30,
    opacity: 0.9,
  },
  leafOne: {
    top: 42,
    right: 102,
    transform: [{ rotate: '22deg' }],
  },
  leafTwo: {
    top: 83,
    right: 50,
    transform: [{ rotate: '206deg' }],
  },
  leafThree: {
    top: 123,
    right: 122,
    transform: [{ rotate: '30deg' }],
  },
  leafFour: {
    top: 158,
    right: 70,
    transform: [{ rotate: '210deg' }],
  },
  orbit: {
    position: 'absolute',
    top: 20,
    right: -34,
    width: 232,
    height: 142,
    borderWidth: 2,
    borderRadius: 116,
    transform: [{ rotate: '-18deg' }],
    opacity: 0.72,
  },
  planet: {
    position: 'absolute',
    top: 62,
    right: 67,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  spaceStar: {
    position: 'absolute',
    borderRadius: radii.pill,
  },
  spaceStarOne: {
    top: 35,
    left: 43,
    width: 5,
    height: 5,
  },
  spaceStarTwo: {
    top: 93,
    left: 91,
    width: 8,
    height: 8,
  },
  spaceStarThree: {
    top: 151,
    left: 54,
    width: 4,
    height: 4,
  },
  grid: {
    position: 'absolute',
    top: 20,
    right: 22,
    width: 128,
    height: 128,
    transform: [{ rotate: '7deg' }],
    opacity: 0.72,
  },
  gridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridHorizontal: {
    position: 'absolute',
    right: 0,
    left: 0,
    height: 1,
  },
  gridDot: {
    position: 'absolute',
    top: 77,
    left: 77,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: radii.pill,
    opacity: 0.74,
  },
  ringOuter: {
    top: -30,
    right: -22,
    width: 218,
    height: 218,
  },
  ringMiddle: {
    top: 10,
    right: 18,
    width: 138,
    height: 138,
  },
  ringInner: {
    top: 47,
    right: 55,
    width: 64,
    height: 64,
  },
});

export default BookCover;
