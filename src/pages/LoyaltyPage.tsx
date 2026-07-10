import { Link } from 'react-router-dom'
import { Gift } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

const LOYALTY_GOAL = 200

export default function LoyaltyPage() {
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)

  if (!ready) return <main className="container-edge py-16 text-center text-muted">Chargement…</main>

  if (!user) {
    return (
      <main className="container-edge py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <Gift size={28} className="text-muted" />
        </div>
        <h1 className="mt-6 text-display">Fidélité</h1>
        <p className="mt-2 text-muted">Connecte-toi pour voir tes points de fidélité.</p>
        <Link to="/connexion" className="mt-6 inline-block">
          <Button variant="dark">Se connecter</Button>
        </Link>
      </main>
    )
  }

  const points = user.loyaltyPoints ?? 0
  const pct = Math.min(100, Math.round((points / LOYALTY_GOAL) * 100))

  return (
    <main className="container-edge max-w-2xl py-8">
      <h1 className="text-display">Fidélité</h1>
      <p className="mt-2 text-muted">1 point gagné pour chaque euro dépensé, crédité une fois ta commande livrée.</p>

      <div className="card-surface mt-6 p-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-bold text-ink">
            <Gift size={20} className="text-sunset-500" /> Mon solde
          </span>
          <span className="text-2xl font-bold text-ink">{points} pts</span>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface-alt">
          <div className="h-full rounded-full bg-sunset-500 transition-all" style={{ width: `${pct}%` }} />
        </div>

        <p className="mt-2 text-sm text-muted">
          {points >= LOYALTY_GOAL
            ? 'Tu as assez de points pour une livraison offerte ! Coche la case au checkout pour l\'utiliser.'
            : `Encore ${LOYALTY_GOAL - points} pts avant de débloquer une livraison offerte (${LOYALTY_GOAL} pts).`}
        </p>
      </div>

      <div className="card-surface mt-4 p-6">
        <h2 className="font-bold text-ink">Comment ça marche</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>• 1 point gagné par euro dépensé (hors frais de livraison et de service).</li>
          <li>• Les points sont crédités une fois ta commande livrée.</li>
          <li>• 200 points = une livraison offerte sur une prochaine commande.</li>
          <li>• Utilise tes points en cochant la case dédiée au moment du paiement.</li>
        </ul>
      </div>

      <Link to="/commandes" className="mt-6 inline-block">
        <Button variant="dark">Voir mes commandes</Button>
      </Link>
    </main>
  )
}
