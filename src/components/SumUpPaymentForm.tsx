import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

declare global {
  interface Window {
    SumUpCard?: {
      mount: (opts: {
        id: string
        checkoutId: string
        locale?: string
        onResponse: (type: string, body: any) => void
      }) => { unmount: () => void }
    }
  }
}

const SDK_URL = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js'

let sdkPromise: Promise<void> | null = null
function loadSdk(): Promise<void> {
  if (window.SumUpCard) return Promise.resolve()
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SDK_URL
      s.onload = () => resolve()
      s.onerror = () => { sdkPromise = null; reject(new Error('Impossible de charger le module de paiement SumUp.')) }
      document.head.appendChild(s)
    })
  }
  return sdkPromise
}

interface Props {
  checkoutId: string
  orderNumber: string
  onSuccess: () => void
  onError: (msg: string) => void
}

export default function SumUpPaymentForm({ checkoutId, orderNumber, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(true)
  const widgetRef = useRef<{ unmount: () => void } | null>(null)

  useEffect(() => {
    let cancelled = false

    loadSdk()
      .then(() => {
        if (cancelled || !window.SumUpCard) return
        widgetRef.current = window.SumUpCard.mount({
          id: 'sumup-card',
          checkoutId,
          locale: 'fr-FR',
          onResponse: async (type, body) => {
            if (type === 'sent') return
            setLoading(false)
            if (type === 'success' && body?.status === 'PAID') {
              // Vérification côté serveur avant de confirmer la commande
              try {
                const { status } = await api.sumup.confirm(orderNumber)
                if (status === 'PAID') onSuccess()
                else onError('Le paiement n\'a pas pu être confirmé. Réessayez.')
              } catch {
                onError('Erreur lors de la confirmation du paiement.')
              }
            } else if (type === 'error' || body?.status === 'FAILED') {
              onError(body?.message ?? 'Paiement refusé. Vérifiez votre carte.')
            }
          },
        })
        setLoading(false)
      })
      .catch((e) => { if (!cancelled) { setLoading(false); onError(e.message) } })

    return () => {
      cancelled = true
      widgetRef.current?.unmount()
      widgetRef.current = null
    }
  }, [checkoutId])

  return (
    <div>
      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-muted">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Chargement du paiement sécurisé…
        </div>
      )}
      <div id="sumup-card" />
    </div>
  )
}
