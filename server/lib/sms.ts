import { env } from './env'

/** Envoie un SMS via l'API REST Twilio. Ne lève jamais — un échec SMS ne doit pas casser la création de commande. */
export async function sendSms(to: string, body: string): Promise<void> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    console.warn('[sms] Twilio non configuré — SMS non envoyé.')
    return
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: env.TWILIO_FROM_NUMBER, Body: body }),
    })
    if (!res.ok) {
      console.error('[sms] Échec envoi Twilio', res.status, await res.text())
    }
  } catch (e) {
    console.error('[sms] Erreur envoi Twilio', e)
  }
}

/** Notifie l'admin par SMS d'une nouvelle commande, si activé dans les paramètres. */
export async function notifyAdminNewOrder(opts: {
  orderNumber: string
  restaurantName: string
  total: number
  enabled: boolean
}): Promise<void> {
  if (!opts.enabled || !env.ADMIN_NOTIFY_PHONE) return
  const body = `UBOBO — Nouvelle commande ${opts.orderNumber} (${opts.restaurantName}) — ${opts.total.toFixed(2)} €`
  await sendSms(env.ADMIN_NOTIFY_PHONE, body)
}
