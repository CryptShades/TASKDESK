import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { LayoutDashboard, Briefcase, CheckSquare, Settings, Bell } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useUserStore } from '../../src/store';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const { user } = useUserStore();
  const router = useRouter();

  const isMember = user?.role === 'member';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.foregroundMuted,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          ...theme.typography.h3,
          color: theme.colors.foreground,
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/notifications')}
            style={{ marginRight: theme.spacing.lg }}
          >
            <Bell size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      
      {!isMember && (
        <Tabs.Screen
          name="campaigns/index"
          options={{
            title: 'Campaigns',
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
          }}
        />
      )}

      {/* Hide the detail route from the tab bar but keep it in the navigator */}
      <Tabs.Screen
        name="campaigns/[id]"
        options={{
          href: null,
          title: 'Campaign Detail',
        }}
      />

      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'My Tasks',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="tasks/[id]"
        options={{
          href: null,
          title: 'Task Detail',
        }}
      />

      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
