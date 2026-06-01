import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'

interface Props {
  slug: string
  className?: string
  size?: number
}

export default function FavoriteButton({ slug, className, size = 16 }: Props) {
  const user = useAuth((s) => s.user)
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { setActive(false); return }
    api.favorites.list()
      .then((res) => setActive(res.favorites.some((f) => f.restaurantSlug === slug)))
      .catch(() => {})
  }, [user, slug])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/connexion'); return }
    setBusy(true)
    try {
      if (active) {
        await api.favorites.remove(slug)
        setActive(false)
        toast.info('Retiré des favoris')
      } else {
        await api.favorites.add(slug)
        setActive(true)
        toast.success('Ajouté aux favoris')
      }
    } catch {
      toast.error('Action impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card transition-all hover:scale-105 active:scale-95',
        active ? 'text-red-500' : 'text-muted hover:text-ink',
        className
      )}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart size={size} fill={active ? 'currentColor' : 'none'} strokeWidth={2.2} />
    </button>
  )
}
