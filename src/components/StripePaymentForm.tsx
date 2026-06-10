import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Button from './ui/Button'

interface Props {
  onSuccess: () => void
  onError: (msg: string) => void
  totalLabel: string
}

export default function StripePaymentForm({ onSuccess, onError, totalLabel }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })
      if (error) {
        onError(error.message ?? 'Paiement refusé')
      } else {
        onSuccess()
      }
    } finally {
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
      <Button type="submit" variant="dark" size="lg" fullWidth disabled={paying || !stripe}>
        {paying ? 'Traitement…' : `Payer · ${totalLabel}`}
      </Button>
    </form>
  )
}
