import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { useLibrary } from '../../context/LibraryContext';
import { INTERESTS } from '../../data/books';
import { colors, radii, spacing, typography } from '../../theme';

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons color={colors.violet} name={icon} size={19} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    displayName,
    resetLibrary,
    savedBooks,
    selectedInterests,
    toggleInterest,
  } = useLibrary();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'R';
  const handle =
    displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'reader';

  return (
    <Screen contentContainerStyle={styles.screenContent} scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR PROFILE</Text>
            <Text style={styles.pageTitle}>Reading, your way.</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons color={colors.violet} name="sparkles" size={13} />
            <Text style={styles.headerBadgeText}>FIRST EDITION</Text>
          </View>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatarHalo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons color={colors.white} name="sparkles" size={12} />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.handle}>@{handle} · Vancouver, BC</Text>
          <View style={styles.tasteBadge}>
            <Ionicons color={colors.violet} name="heart" size={14} />
            <Text style={styles.tasteBadgeText}>Curious mood reader</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat icon="bookmark-outline" label="Saved" value={savedBooks.length} />
          <View style={styles.statDivider} />
          <Stat
            icon="color-palette-outline"
            label="Interests"
            value={selectedInterests.length}
          />
          <View style={styles.statDivider} />
          <Stat icon="flame-outline" label="Day streak" value={7} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your reading taste</Text>
              <Text style={styles.sectionSubtitle}>
                Tap to fine-tune your recommendations.
              </Text>
            </View>
            <Text style={styles.selectedCount}>
              {selectedInterests.length} selected
            </Text>
          </View>
          <View style={styles.chipGrid}>
            {INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest.id);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={interest.id}
                  onPress={() => toggleInterest(interest.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.chipEmoji}>{interest.emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {interest.label}
                  </Text>
                  {selected ? (
                    <Ionicons color={colors.violet} name="checkmark" size={14} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This month</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalIcon}>
              <Ionicons color={colors.violet} name="book-outline" size={22} />
            </View>
            <View style={styles.goalCopy}>
              <View style={styles.goalTopRow}>
                <Text style={styles.goalTitle}>Reading goal</Text>
                <Text style={styles.goalValue}>2 of 4 books</Text>
              </View>
              <View style={styles.goalTrack}>
                <View style={styles.goalFill} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons
                  color={colors.violet}
                  name="notifications-outline"
                  size={20}
                />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Reading reminders</Text>
                <Text style={styles.settingSubtitle}>
                  A gentle nudge for your saved shelf
                </Text>
              </View>
              <Switch
                accessibilityLabel="Reading reminders"
                onValueChange={setRemindersEnabled}
                thumbColor={colors.white}
                trackColor={{
                  false: colors.surfaceMuted,
                  true: colors.violet,
                }}
                value={remindersEnabled}
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons
                  color={colors.violet}
                  name="reader-outline"
                  size={20}
                />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Preferred format</Text>
                <Text style={styles.settingSubtitle}>
                  Print and digital editions
                </Text>
              </View>
              <View style={styles.formatPill}>
                <Text style={styles.formatText}>Both</Text>
              </View>
            </View>
          </View>
        </View>

        <PrimaryButton
          icon="log-out-outline"
          label="Sign out"
          onPress={() => {
            resetLibrary();
            router.dismissAll();
            requestAnimationFrame(() => router.replace('/'));
          }}
          style={styles.signOut}
          variant="secondary"
        />
        <Text style={styles.version}>Slidebook · First edition</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: spacing.xl,
  },
  container: {
    alignSelf: 'center',
    maxWidth: 680,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.violet,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.xxs,
  },
  pageTitle: {
    ...typography.heading,
    color: colors.ink,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: colors.violetWash,
    borderColor: colors.violetSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xxs,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  headerBadgeText: {
    color: colors.violetDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  identityCard: {
    alignItems: 'center',
    backgroundColor: colors.violetWash,
    borderColor: colors.violetSoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginTop: spacing.lg,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  avatarHalo: {
    marginBottom: spacing.sm,
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderColor: colors.surfaceRaised,
    borderRadius: 42,
    borderWidth: 4,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  avatarBadge: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.surfaceRaised,
    borderRadius: 13,
    borderWidth: 2,
    bottom: 0,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 26,
  },
  name: {
    ...typography.heading,
    color: colors.ink,
  },
  handle: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  tasteBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.violetSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xxs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  tasteBadgeText: {
    color: colors.violetDark,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  statDivider: {
    backgroundColor: colors.border,
    height: 40,
    width: 1,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.ink,
    fontSize: 19,
    lineHeight: 24,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  selectedCount: {
    ...typography.caption,
    color: colors.violet,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.violetWash,
    borderColor: colors.violet,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: colors.violetDark,
  },
  goalCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  goalIcon: {
    alignItems: 'center',
    backgroundColor: colors.violetWash,
    borderRadius: 18,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  goalCopy: {
    flex: 1,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalTitle: {
    ...typography.label,
    color: colors.ink,
  },
  goalValue: {
    ...typography.caption,
    color: colors.violet,
  },
  goalTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    height: 7,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  goalFill: {
    backgroundColor: colors.violet,
    borderRadius: radii.pill,
    height: '100%',
    width: '50%',
  },
  settingsCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: colors.violetWash,
    borderRadius: 15,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    ...typography.label,
    color: colors.ink,
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  settingDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginLeft: 68,
  },
  formatPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  formatText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  signOut: {
    marginTop: spacing.xl,
  },
  version: {
    ...typography.caption,
    color: colors.inkSubtle,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.68,
  },
});
