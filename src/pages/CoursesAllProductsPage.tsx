import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react'
import { request } from '@/lib/api'
import useCartStore from '@/store/cart.store'
import Seo from '@/components/shared/Seo'

interface AuchanProduct {
  productId: string
  name: string
  brand: string | null
  price: number | null
  weightVolume: string | null
  imageUrl: string | null
  category: string
}

interface ApiResponse {
  total: number
  page: number
  limit: number
  products: AuchanProduct[]
}

export default function CoursesAllProductsPage() {
  const [products, setProducts] = useState<AuchanProduct[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const LIMIT = 40

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
      const data = await request<ApiResponse>(`/api/courses/all?${params}`)
      setProducts(data.products)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  function goPage(p: number) {
    setPage(p)
    load(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <main className="pb-16">
      <Seo
        title="Tous les produits — Courses Cap Ferret | UBOBO"
        description="Tous les produits Auchan, classés par ordre alphabétique, livrés sur la Pointe du Cap Ferret."
        path="/courses/categorie/tous"
      />
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/courses" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={15} /> Retour aux rayons
          </Link>
          <div className="mt-2">
            <h1 className="text-3xl font-black text-white drop-shadow">Tous les produits</h1>
            <p className="mt-1 text-white/80">{total} produit{total > 1 ? 's' : ''} · classés par nom</p>
          </div>
        </div>
      </div>

      <section className="container-edge pt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-surface-alt animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-muted">Aucun produit trouvé.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {products.map((p) => <ProductCard key={p.productId} product={p} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button onClick={() => goPage(page - 1)} disabled={page === 1}
                  className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-40 hover:bg-surface-alt transition-colors">
                  ← Précédent
                </button>
                <span className="text-sm text-muted">Page {page} / {totalPages}</span>
                <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
                  className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-40 hover:bg-surface-alt transition-colors">
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

function ProductCard({ product }: { product: AuchanProduct }) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const cartItem = items.find((i) => i.id === product.productId)
  const qty = cartItem?.quantity ?? 0

  function handleAdd() {
    addItem(
      {
        id: product.productId,
        name: product.brand ? `${product.brand} ${product.name}` : product.name,
        description: product.weightVolume ?? '',
        price: product.price ?? 0,
        category: 'courses',
        available: true,
        image: product.imageUrl ?? undefined,
      },
      'auchan-lege',
      'Auchan Lège-Cap-Ferret',
    )
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <div className="bg-white p-3 aspect-square">
        <img
          src={product.imageUrl ?? '/categories/halles.jpeg'}
          alt={product.name}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/categories/halles.jpeg' }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{product.brand}</p>
        )}
        <p className="text-xs font-semibold text-ink leading-snug line-clamp-2">{product.name}</p>
        {product.weightVolume && (
          <span className="mt-auto rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] text-muted w-fit">
            {product.weightVolume}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-line px-3 py-2.5">
        <span className="text-base font-black text-ink">
          {product.price != null ? `${product.price.toFixed(2)}€` : '—'}
        </span>
        {qty === 0 ? (
          <button onClick={handleAdd} disabled={product.price == null}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-surface transition-transform active:scale-90 hover:opacity-80 disabled:opacity-40">
            <ShoppingCart size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => qty <= 1 ? removeItem(product.productId) : updateQty(product.productId, qty - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-alt text-ink hover:bg-card transition-colors">
              <Minus size={12} />
            </button>
            <span className="w-5 text-center text-sm font-bold text-ink">{qty}</span>
            <button onClick={() => updateQty(product.productId, qty + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-surface hover:opacity-80 transition-colors">
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
