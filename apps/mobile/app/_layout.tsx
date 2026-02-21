import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/lib/supabase';
import { useUserStore, useNotificationStore } from '../src/store';
import { theme } from '../src/theme';
import { initRealtime, addRealtimeListener } from '../src/lib/realtime';
import { NotificationBanner } from '../src/components/NotificationBanner';

export default function RootLayout() {
  const { user, setUser, setOrg, clear, organization } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncUser(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          syncUser(session.user.id);
        } else {
          clear();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function syncUser(userId: string) {
    const { data: profile } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', userId)
      .single();

    if (profile) {
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      });
      
      if (profile.organization) {
        setOrg({
          id: profile.organization.id,
          name: profile.organization.name,
        });
      }
    }
  }

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [user, segments]);

  // Realtime initialization
  useEffect(() => {
    if (user?.id && organization?.id) {
      const cleanup = initRealtime(organization.id, user.id);
      const unsubscribe = addRealtimeListener((event, payload) => {
        if (event === 'notification:new') {
          setActiveNotification(payload);
        }
      });

      return () => {
        cleanup();
        unsubscribe();
      };
    }
  }, [user?.id, organization?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
        </Stack>
        {activeNotification && (
          <NotificationBanner 
            notification={activeNotification} 
            onClose={() => setActiveNotification(null)} 
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
