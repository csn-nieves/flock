import { createClient } from 'npm:@supabase/supabase-js@2.117.2'
import webpush from 'npm:web-push@3.6.7'

import {
  isAuthorizedWebhookRequest,
  parseWebhookSecretKeys,
} from './authorizeWebhook.ts'

type WebhookPayload = {
  record?: {
    id?: string
    status?: string
  }
  type?: 'INSERT' | 'UPDATE'
}

type ClaimedNotification = {
  auth_key: string
  endpoint: string
  job_id: string
  notification_body: string
  notification_path: string
  notification_tag: string
  notification_title: string
  p256dh: string
  subscription_id: string
  ttl_seconds: number
}

type PushError = Error & {
  statusCode?: number
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const webhookSecretKeys = parseWebhookSecretKeys(
    Deno.env.get('SUPABASE_SECRET_KEYS'),
  )
  const vapidPublicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('WEB_PUSH_SUBJECT')

  if (!supabaseUrl || !serviceRoleKey || webhookSecretKeys.length === 0) {
    return new Response('Function authentication is not configured', {
      status: 500,
    })
  }

  if (
    !isAuthorizedWebhookRequest(
      request.headers,
      webhookSecretKeys,
      serviceRoleKey,
    )
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return new Response('Push delivery is not configured', { status: 500 })
  }

  const payload = (await request.json()) as WebhookPayload
  const jobId = payload.record?.id
  if (!jobId || payload.record?.status !== 'pending') {
    return new Response(null, { status: 204 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
  const { data, error } = await supabase.rpc('claim_push_notification', {
    target_job_id: jobId,
  })

  if (error) {
    console.error('Could not claim push notification job', error.message)
    return new Response('Could not claim notification', { status: 500 })
  }

  const subscriptions = (data ?? []) as ClaimedNotification[]
  if (subscriptions.length === 0) {
    return new Response(null, { status: 204 })
  }

  const notification = subscriptions[0]
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth_key,
              p256dh: subscription.p256dh,
            },
          },
          JSON.stringify({
            body: subscription.notification_body,
            tag: subscription.notification_tag,
            title: subscription.notification_title,
            url: subscription.notification_path,
          }),
          { TTL: subscription.ttl_seconds },
        )
        return { delivered: true, staleSubscriptionId: undefined }
      } catch (cause) {
        const pushError = cause as PushError
        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          return {
            delivered: false,
            staleSubscriptionId: subscription.subscription_id,
          }
        }

        console.error('Push service rejected a notification', {
          message: pushError.message,
          statusCode: pushError.statusCode,
          subscriptionId: subscription.subscription_id,
        })
        return { delivered: false, error: 'A push service request failed.' }
      }
    }),
  )

  const deliveredCount = results.filter((result) => result.delivered).length
  const staleSubscriptionIds = results.flatMap((result) =>
    result.staleSubscriptionId ? [result.staleSubscriptionId] : [],
  )
  const failureMessage = results.some((result) => result.error)
    ? 'One or more push service requests failed.'
    : null

  const { error: completionError } = await supabase.rpc(
    'complete_push_notification',
    {
      delivered_count: deliveredCount,
      failure_message: failureMessage,
      stale_subscription_ids: staleSubscriptionIds,
      target_job_id: notification.job_id,
    },
  )

  if (completionError) {
    console.error(
      'Could not complete push notification job',
      completionError.message,
    )
    return new Response('Could not complete notification', { status: 500 })
  }

  return Response.json({
    delivered: deliveredCount,
    removed: staleSubscriptionIds.length,
  })
})
