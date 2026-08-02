import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii, shadows, spacing, typography } from '../theme';

export type PrimaryButtonVariant = 'primary' | 'secondary' | 'ghost';
export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface PrimaryButtonProps
  extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  icon?: IoniconName;
  variant?: PrimaryButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityState,
  style,
  ...pressableProps
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'primary' ? colors.white : colors.violetDark;

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant].button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          accessibilityElementsHidden
          color={spinnerColor}
          size="small"
        />
      ) : icon ? (
        <Ionicons
          accessibilityElementsHidden
          color={variantStyles[variant].text.color}
          name={icon}
          size={20}
        />
      ) : null}
      <Text style={[styles.label, variantStyles[variant].text]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  label: {
    ...typography.bodyStrong,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.48,
  },
});

const variantStyles = {
  primary: StyleSheet.create({
    button: {
      backgroundColor: colors.violet,
      ...shadows.floating,
    },
    text: {
      color: colors.white,
    },
  }),
  secondary: StyleSheet.create({
    button: {
      backgroundColor: colors.violetWash,
      borderWidth: 1,
      borderColor: colors.violetSoft,
    },
    text: {
      color: colors.violetDark,
    },
  }),
  ghost: StyleSheet.create({
    button: {
      backgroundColor: 'transparent',
    },
    text: {
      color: colors.violetDark,
    },
  }),
} satisfies Record<
  PrimaryButtonVariant,
  { button: ViewStyle; text: { color: string } }
>;

export default PrimaryButton;
