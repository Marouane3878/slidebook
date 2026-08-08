import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLibrary } from '../context/LibraryContext';
import { colors, radii, spacing } from '../theme';

export function LibrarySyncNotice({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const { clearLibraryError, libraryError } = useLibrary();

  if (!libraryError) {
    return null;
  }

  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, style]}>
      <Ionicons color={colors.danger} name="cloud-offline-outline" size={18} />
      <Text style={styles.text}>{libraryError}</Text>
      <Pressable
        accessibilityLabel="Dismiss database message"
        accessibilityRole="button"
        hitSlop={8}
        onPress={clearLibraryError}
      >
        <Ionicons color={colors.danger} name="close" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignItems: 'center',
    backgroundColor: '#FBECEE',
    borderColor: '#EFCBD0',
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  text: {
    color: colors.danger,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
