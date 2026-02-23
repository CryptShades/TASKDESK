import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../../src/theme';
import { signIn } from '../../src/lib/auth';
import { registerToken } from '../../src/services/push-notifications';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await signIn(email, password);
      // Re-register push token after login — tokens can change on app reinstall
      // or when Expo rotates them; a stale token causes silent push failures.
      if (data.user?.id) {
        registerToken(data.user.id).catch(() => {
          // Non-critical: push registration failure must not block sign-in
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>Taskdesk</Text>
          <Text style={styles.tagline}>Intelligent Project Management</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@company.com"
              placeholderTextColor={theme.colors.foregroundMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.foregroundMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    fontSize: 40,
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    ...theme.typography.body,
    color: theme.colors.foregroundMuted,
  },
  form: {
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.foreground,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    ...theme.typography.body,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.white,
  },
  errorText: {
    ...theme.typography.small,
    color: theme.colors.riskHard,
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    ...theme.typography.small,
    color: theme.colors.primary,
  },
});
