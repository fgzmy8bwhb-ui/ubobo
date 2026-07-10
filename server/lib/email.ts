import { env } from './env'

/** Envoie un email via l'API REST Resend. Ne lève jamais — un échec email ne doit pas casser la commande. */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] Resend non configuré — email non envoyé.')
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    })
    if (!res.ok) {
      console.error('[email] Échec envoi Resend', res.status, await res.text())
    }
  } catch (e) {
    console.error('[email] Erreur envoi Resend', e)
  }
}

function layout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #64748b;">UBOBO — Livraison locale Cap Ferret</p>
    </div>
  `
}

export function orderConfirmationEmail(opts: {
  orderNumber: string
  restaurantName: string
  items: Array<{ name: string; quantity: number }>
  total: number
  deliveryDate?: string | null
  deliverySlot?: string | null
}): { subject: string; html: string } {
  const itemsHtml = opts.items.map((i) => `<li>${i.quantity} × ${i.name}</li>`).join('')
  const deliveryLine = opts.deliveryDate
    ? `<p><strong>Livraison prévue :</strong> ${opts.deliveryDate}${opts.deliverySlot ? ` à ${opts.deliverySlot}` : ''}</p>`
    : ''
  return {
    subject: `Commande ${opts.orderNumber} confirmée — UBOBO`,
    html: layout('Commande confirmée !', `
      <p>Merci pour votre commande chez <strong>${opts.restaurantName}</strong>.</p>
      <p><strong>N° de commande :</strong> ${opts.orderNumber}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total :</strong> ${opts.total.toFixed(2)} €</p>
      ${deliveryLine}
      <p>Vous pouvez suivre votre commande à tout moment :
        <a href="${env.FRONTEND_URL}/suivi/${opts.orderNumber}">${env.FRONTEND_URL}/suivi/${opts.orderNumber}</a>
      </p>
    `),
  }
}

export function reviewRequestEmail(opts: {
  orderNumber: string
  restaurantName: string
}): { subject: string; html: string } {
  const link = `${env.FRONTEND_URL}/avis/${opts.orderNumber}`
  return {
    subject: `Comment était votre commande chez ${opts.restaurantName} ?`,
    html: layout('Votre commande est livrée !', `
      <p>On espère que tout s'est bien passé avec <strong>${opts.restaurantName}</strong>.</p>
      <p>Votre avis compte beaucoup pour nous et pour les commerçants du Cap Ferret.</p>
      <p style="margin-top:24px;">
        <a href="${link}" style="display:inline-block; background:#0f172a; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:600;">
          Laisser un avis
        </a>
      </p>
    `),
  }
}
