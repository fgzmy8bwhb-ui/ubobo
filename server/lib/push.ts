import { env } from './env'

async function sendNotification(payload: Record<string, unknown>): Promise<void> {
  if (!env.ONESIGNAL_REST_API_KEY) {
    console.warn('[push] OneSignal non configuré — notification non envoyée.')
    return
  }
  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ app_id: env.ONESIGNAL_APP_ID, ...payload }),
    })
    if (!res.ok) {
      console.error('[push] Échec envoi OneSignal', res.status, await res.text())
    }
  } catch (e) {
    console.error('[push] Erreur envoi OneSignal', e)
  }
}

/** Notifie tous les navigateurs identifiés comme admin (tag role=admin). */
export async function pushToAdmin(title: string, message: string, url?: string): Promise<void> {
  await sendNotification({
    filters: [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }],
    headings: { en: title, fr: title },
    contents: { en: message, fr: message },
    url,
  })
}

/** Notifie un client précis via son id utilisateur (OneSignal external_id). */
export async function pushToUser(userId: string, title: string, message: string, url?: string): Promise<void> {
  await sendNotification({
    include_external_user_ids: [userId],
    headings: { en: title, fr: title },
    contents: { en: message, fr: message },
    url,
  })
}
