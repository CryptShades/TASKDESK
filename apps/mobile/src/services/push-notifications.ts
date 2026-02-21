import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }
  return true;
}

export async function getExpoPushToken() {
  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Ensure this is in .env
    })).data;
    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

export async function registerToken(userId: string) {
  const token = await getExpoPushToken();
  if (!token) return;

  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: token })
    .eq('id', userId);

  if (error) {
    console.error('Failed to register push token in DB:', error);
  }
}

export function setupNotificationListeners(onReceive?: (notification: Notifications.Notification) => void) {
  // Foreground listener
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    if (onReceive) onReceive(notification);
  });

  // Background/Tap listener
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log('Notification tapped with data:', data);
    // Navigation logic would go here, typically handled by Expo Router 
    // or a global navigation ref if using complex custom routing.
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
