import type { NotificationPreferences } from '@src/types/notificationPreferences'
import { supabase } from './supabase'

type NotificationPreferencesRow = {
  chat_messages: boolean
  event_invitations: boolean
  flock_events: boolean
}

function mapPreferences(
  row: NotificationPreferencesRow,
): NotificationPreferences {
  return {
    chatMessages: row.chat_messages,
    eventInvitations: row.event_invitations,
    flockEvents: row.flock_events,
  }
}

export async function getNotificationPreferences() {
  const { data, error } = await supabase.rpc('get_notification_preferences')
  if (error) throw error
  return mapPreferences(data as NotificationPreferencesRow)
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
) {
  const { data, error } = await supabase.rpc(
    'update_notification_preferences',
    {
      target_chat_messages: preferences.chatMessages,
      target_event_invitations: preferences.eventInvitations,
      target_flock_events: preferences.flockEvents,
    },
  )
  if (error) throw error
  return mapPreferences(data as NotificationPreferencesRow)
}
