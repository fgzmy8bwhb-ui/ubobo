import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Check } from 'lucide-react'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'

export default function ReviewPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!orderNumber) return
    api.reviews.guestInfo(orderNumber)
      .then((r) => {
        setRestaurantName(r.restaurantName)
        setAlreadyReviewed(r.alreadyReviewed)
        if (r.existingReview) {
          setRating(r.existingReview.rating)
          setComment(r.existingReview.comment ?? '')
        }
      })
      .catch((e: any) => {
        const code = e?.message
        if (code === 'ORDER_NOT_FOUND') setError('Commande introuvable.')
        else if (code === 'ORDER_NOT_DELIVERED') setError('Cette commande n\'est pas encore livrée.')
        else setError('Une erreur est survenue.')
      })
      .finally(() => setLoading(false))
  }, [orderNumber])

  async function submit() {
    if (!orderNumber || rating === 0) return
    setSubmitting(true)
    try {
      await api.reviews.guestCreate({ orderNumber, rating, comment: comment.trim() || undefined })
      setDone(true)
    } catch (e: any) {
      toast.error(e?.message === 'ALREADY_REVIEWED' ? 'Vous avez déjà laissé un avis pour cette commande.' : 'Erreur lors de l\'envoi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <main className="container-edge py-24 text-center text-muted">Chargement…</main>

  if (error) {
    return (
      <main className="container-edge max-w-md py-24 text-center">
        <h1 className="text-display">Avis</h1>
        <p className="mt-3 text-muted">{error}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="secondary">Retour à l'accueil</Button>
        </Link>
      </main>
    )
  }

  if (done || alreadyReviewed) {
    return (
      <main className="container-edge max-w-md py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
          <Check size={28} strokeWidth={2.5} />
        </div>
        <h1 className="mt-6 text-display">Merci !</h1>
        <p className="mt-2 text-muted">
          {done ? 'Votre avis a été enregistré.' : 'Vous avez déjà laissé un avis pour cette commande.'}
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="dark">Retour à l'accueil</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="container-edge max-w-md py-16">
      <h1 className="text-display">Votre avis</h1>
      <p className="mt-2 text-muted">Comment était votre commande chez <strong>{restaurantName}</strong> ?</p>

      <div className="card-surface mt-6 p-6">
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1
            const filled = value <= (hoverRating || rating)
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
              >
                <Star
                  size={36}
                  className={cn('transition-colors', filled ? 'text-sunset-400' : 'text-line')}
                  fill={filled ? 'currentColor' : 'none'}
                  strokeWidth={1.5}
                />
              </button>
            )
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Un commentaire (facultatif)"
          rows={4}
          className="input-base mt-6 resize-none"
        />

        <Button onClick={submit} disabled={rating === 0 || submitting} variant="dark" className="mt-4 w-full">
          {submitting ? '…' : 'Envoyer mon avis'}
        </Button>
      </div>
    </main>
  )
}
