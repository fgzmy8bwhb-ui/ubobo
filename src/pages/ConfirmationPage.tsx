import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import useCartStore from '@/store/cart.store'
import { Button } from '@/components/ui'

/**
 * Kept for backward compatibility — production flow now redirects directly
 * to /suivi/:orderNumber after order creation.
 */
export default function ConfirmationPage() {
  const lastOrder = useCartStore((s) => s.lastOrder)
  const navigate = useNavigate()

  useEffect(() => {
    if (lastOrder?.orderNumber) {
      navigate(`/suivi/${lastOrder.orderNumber}`, { replace: true })
    }
  }, [lastOrder, navigate])

  if (!lastOrder) {
    return (
      <main className="container-edge py-24 text-center">
        <p className="text-lg font-bold">Aucune commande récente.</p>
        <Link to="/restaurants" className="mt-6 inline-block">
          <Button size="md">Voir les restaurants</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="container-edge py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pine text-white">
        <Check size={32} />
      </div>
      <h1 className="mt-6 text-section">Commande confirmée</h1>
      <p className="mt-2 text-muted">Numéro de commande : {lastOrder.orderNumber}</p>
      <Link to={`/suivi/${lastOrder.orderNumber}`} className="mt-8 inline-block">
        <Button size="md">Suivre la commande</Button>
      </Link>
    </main>
  )
}
