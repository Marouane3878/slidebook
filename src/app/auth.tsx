import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useLibrary } from '../context/LibraryContext';
import { colors, radii, spacing, typography } from '../theme';

type AuthMode = 'signup' | 'login';

type FieldProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words';
  icon: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: 'default' | 'email-address';
  label: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder: string;
  returnKeyType?: 'go' | 'next';
  secureTextEntry?: boolean;
  value: string;
  onToggleSecure?: () => void;
};

function Field({
  autoCapitalize = 'none',
  icon,
  keyboardType = 'default',
  label,
  onChangeText,
  onSubmitEditing,
  onToggleSecure,
  placeholder,
  returnKeyType,
  secureTextEntry,
  value,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons color={colors.inkSubtle} name={icon} size={19} />
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSubtle}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          selectionColor={colors.violet}
          style={styles.input}
          value={value}
        />
        {onToggleSecure ? (
          <Pressable
            accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onToggleSecure}
          >
            <Ionicons
              color={colors.inkMuted}
              name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();
  const { loadDemoAccount, setDisplayName } = useLibrary();
  const initialMode = useMemo<AuthMode>(
    () => (params.mode === 'login' ? 'login' : 'signup'),
    [params.mode],
  );
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [error, setError] = useState('');

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
  };

  const submit = () => {
    Keyboard.dismiss();

    if (mode === 'signup' && !name.trim()) {
      setError('Add your name so we know what to call you.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }

    setError('');
    if (mode === 'signup') {
      setDisplayName(name.trim());
      router.push('/interests');
    } else {
      const emailName = email
        .split('@')[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(' ');
      loadDemoAccount(emailName || 'Reader');
      router.dismissAll();
      requestAnimationFrame(() => router.replace('/feed'));
    }
  };

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      scroll
    >
      <View style={styles.container}>
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

        <View style={styles.intro}>
          <View style={styles.miniMark}>
            <Ionicons color={colors.white} name="book-outline" size={18} />
          </View>
          <Text style={styles.title}>
            {mode === 'signup' ? 'Create your shelf.' : 'Welcome back.'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signup'
              ? 'A few details, then we’ll make your first set of picks.'
              : 'Your saved stories are right where you left them.'}
          </Text>
        </View>

        <View accessibilityRole="tablist" style={styles.segmentedControl}>
          {(['signup', 'login'] as const).map((item) => {
            const selected = mode === item;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={item}
                onPress={() => changeMode(item)}
                style={[styles.segment, selected && styles.segmentSelected]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selected && styles.segmentTextSelected,
                  ]}
                >
                  {item === 'signup' ? 'Sign up' : 'Log in'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          {mode === 'signup' ? (
            <Field
              autoCapitalize="words"
              icon="person-outline"
              label="Name"
              onChangeText={setName}
              placeholder="Your name"
              value={name}
            />
          ) : null}
          <Field
            icon="mail-outline"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <Field
            icon="lock-closed-outline"
            label="Password"
            onChangeText={setPassword}
            onToggleSecure={() => setPasswordHidden((hidden) => !hidden)}
            onSubmitEditing={submit}
            placeholder="At least 6 characters"
            returnKeyType="go"
            secureTextEntry={passwordHidden}
            value={password}
          />

          {error ? (
            <View accessibilityLiveRegion="polite" style={styles.errorRow}>
              <Ionicons color={colors.danger} name="alert-circle" size={17} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {mode === 'login' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setError('Password reset will be available in the next version.')
              }
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          ) : null}

          <PrimaryButton
            icon="arrow-forward"
            label={mode === 'signup' ? 'Create account' : 'Log in'}
            onPress={submit}
            style={styles.submit}
          />
        </View>

        <View style={styles.demoNote}>
          <Ionicons color={colors.violet} name="flask-outline" size={17} />
          <Text style={styles.demoNoteText}>
            This is a demo—use any valid details to explore the app.
          </Text>
        </View>

        {mode === 'signup' ? (
          <Text style={styles.terms}>
            By continuing, you agree to Slidebook’s Terms and Privacy Policy.
          </Text>
        ) : null}
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
    maxWidth: 520,
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  intro: {
    marginTop: spacing.xl,
  },
  miniMark: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderRadius: 13,
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.md,
    transform: [{ rotate: '-4deg' }],
    width: 42,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    maxWidth: 430,
  },
  segmentedControl: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flexDirection: 'row',
    marginTop: spacing.xl,
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 11,
  },
  segmentSelected: {
    backgroundColor: colors.surfaceRaised,
  },
  segmentText: {
    ...typography.label,
    color: colors.inkMuted,
  },
  segmentTextSelected: {
    color: colors.ink,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.ink,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingVertical: 0,
  },
  errorRow: {
    alignItems: 'center',
    backgroundColor: '#FBECEE',
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    paddingVertical: spacing.xs,
  },
  forgotText: {
    color: colors.violet,
    fontSize: 14,
    fontWeight: '700',
  },
  submit: {
    marginTop: spacing.xs,
  },
  demoNote: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.violetWash,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  demoNoteText: {
    color: colors.violetDark,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  terms: {
    ...typography.caption,
    color: colors.inkSubtle,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
