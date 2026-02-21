import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../../src/theme';
import { useUserStore } from '../../src/store';
import { api } from '../../src/lib/api';
import { Stack, useRouter } from 'expo-router';
import { Save, User as UserIcon } from 'lucide-react-native';

export default function ProfileEditScreen() {
  const { user, setUser } = useUserStore();
  const [name, setName] = useState(user?.name || '');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    setUpdating(true);
    const { data: result, error: apiError } = await api.patch('/api/org/profile', {
      name: name.trim(),
    });

    if (apiError) {
      Alert.alert('Update Failed', apiError);
    } else {
      if (user) {
        setUser({ ...user, name: name.trim() });
      }
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    setUpdating(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <UserIcon size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.emailText}>{user?.email}</Text>
          <Text style={styles.readOnlyNote}>Email cannot be changed on mobile.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.foregroundMuted}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, updating && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
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
  content: {
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  readOnlyNote: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    marginTop: 4,
  },
  form: {
    gap: theme.spacing.xl,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    ...theme.typography.small,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  input: {
    height: 52,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.foreground,
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...theme.typography.body,
    color: 'white',
    fontWeight: '700',
  },
});
