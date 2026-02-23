import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ErrorCode } from '@taskdesk/types';
import { logger } from '@/lib/logger';

export interface CreateNotificationData {
  org_id: string;
  user_id: string;
  task_id?: string;
  campaign_id?: string;
  type: string;
  message: string;
}

export class NotificationError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

export async function getNotifications(userId: string) {
  const supabase = createClient();

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *,
      task:tasks(id, title),
      campaign:campaigns(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new NotificationError(ErrorCode.NOTIFICATIONS_FETCH_FAILED, 'Failed to fetch notifications');
  }

  return notifications;
}

export async function markAsRead(notificationId: string, userId: string) {
  const supabase = createClient();

  const { data: notification, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new NotificationError(ErrorCode.NOTIFICATION_UPDATE_FAILED, 'Failed to mark notification as read');
  }

  return notification;
}

export async function createNotification(data: CreateNotificationData) {
  // Use admin client for INSERT operations since RLS policy only allows service role inserts
  const supabase = createAdminClient();

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new NotificationError(ErrorCode.NOTIFICATION_CREATE_FAILED, 'Failed to create notification');
  }

  return notification;
}

export async function registerPushToken(userId: string, token: string) {
  const supabase = createClient();

  const { data: user, error } = await supabase
    .from('users')
    .update({ expo_push_token: token })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new NotificationError(ErrorCode.TOKEN_UPDATE_FAILED, 'Failed to register push token');
  }

  return user;
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  const supabase = createClient();

  // Get user's push token
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('id', userId)
    .single();

  if (userError) {
    logger.warn('Push notification skipped — failed to fetch user push token', { user_id: userId });
    return { success: false, reason: 'Failed to fetch push token' };
  }

  if (!user?.expo_push_token) {
    logger.info('Push notification skipped — no push token registered', { user_id: userId });
    return { success: false, reason: 'No push token registered' };
  }

  try {
    // Call Expo push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.expo_push_token,
        title,
        body,
        sound: 'default',
      }),
    });

    if (!response.ok) {
      throw new Error(`Expo API error: ${response.status}`);
    }

    const result = await response.json();

    // Update notification as delivered
    await supabase
      .from('notifications')
      .update({ delivered_push: true })
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(1);

    return { success: true, result };
  } catch (error) {
    logger.error('Push notification failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, reason: 'Push API call failed' };
  }
}

export async function markAllAsRead(userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    throw new NotificationError(ErrorCode.NOTIFICATION_UPDATE_FAILED, 'Failed to mark all notifications as read');
  }

  return { success: true };
}