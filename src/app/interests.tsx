import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useLibrary } from '../context/LibraryContext';
import { INTERESTS } from '../data/books';
import { colors, radii, spacing, typography } from '../theme';

const MINIMUM_INTERESTS = 3;

export default function InterestsScreen() {
  const router = useRouter();
  const { selectedInterests, toggleInterest } = useLibrary();
  const canContinue = selectedInterests.length >= MINIMUM_INTERESTS;

  return (
    <Screen contentContainerStyle={styles.screenContent} scroll>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons color={colors.ink} name="arrow-back" size={22} />
          </Pressable>
          <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>TUNE YOUR PICKS</Text>
          <Text style={styles.title}>What do you love to read?</Text>
          <Text style={styles.subtitle}>
            Choose at least {MINIMUM_INTERESTS}. We’ll use these to shape your
            first book feed.
          </Text>
        </View>

        <View style={styles.selectionSummary}>
          <View style={styles.selectionIcon}>
            <Ionicons
              color={canContinue ? colors.success : colors.violet}
              name={canContinue ? 'checkmark' : 'sparkles'}
              size={17}
            />
          </View>
          <Text style={styles.selectionText}>
            {selectedInterests.length}{' '}
            {selectedInterests.length === 1 ? 'interest' : 'interests'} selected
          </Text>
          <Text
            style={[
              styles.selectionStatus,
              canContinue && styles.selectionStatusReady,
            ]}
          >
            {canContinue ? 'Ready to go' : `${MINIMUM_INTERESTS - selectedInterests.length} more`}
          </Text>
        </View>

        <View style={styles.interestGrid}>
          {INTERESTS.map((interest) => {
            const selected = selectedInterests.includes(interest.id);

            return (
              <Pressable
                accessibilityLabel={`${interest.label}${selected ? ', selected' : ''}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                style={({ pressed }) => [
                  styles.interest,
                  selected && styles.interestSelected,
                  pressed && styles.interestPressed,
                ]}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text
                  style={[
                    styles.interestLabel,
                    selected && styles.interestLabelSelected,
                  ]}
                >
                  {interest.label}
                </Text>
                <View
                  style={[
                    styles.checkCircle,
                    selected && styles.checkCircleSelected,
                  ]}
                >
                  {selected ? (
                    <Ionicons
                      color={colors.white}
                      name="checkmark"
                      size={14}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            disabled={!canContinue}
            icon="sparkles"
            label="Build my book feed"
            onPress={() => {
              router.dismissAll();
              requestAnimationFrame(() => router.replace('/feed'));
            }}
          />
          <Text style={styles.helperText}>
            You can update your reading taste anytime from Profile.
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
    maxWidth: 620,
    width: '100%',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backSpacer: {
    width: 44,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    height: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.violet,
    borderRadius: radii.pill,
    height: '100%',
    width: '100%',
  },
  intro: {
    marginTop: spacing.xl,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.violet,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    maxWidth: 500,
  },
  selectionSummary: {
    alignItems: 'center',
    backgroundColor: colors.violetWash,
    borderRadius: radii.md,
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  selectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  selectionText: {
    color: colors.violetDark,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  selectionStatus: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: '700',
  },
  selectionStatusReady: {
    color: colors.success,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  interest: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 60,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  interestSelected: {
    backgroundColor: colors.violetWash,
    borderColor: colors.violet,
  },
  interestPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  interestEmoji: {
    fontSize: 22,
  },
  interestLabel: {
    ...typography.label,
    color: colors.ink,
    flex: 1,
  },
  interestLabelSelected: {
    color: colors.violetDark,
  },
  checkCircle: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    width: 20,
  },
  checkCircleSelected: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderColor: colors.violet,
    justifyContent: 'center',
  },
  actions: {
    marginTop: spacing.xl,
  },
  helperText: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
