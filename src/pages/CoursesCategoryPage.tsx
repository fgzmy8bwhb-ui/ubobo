import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, ShoppingCart, Search } from 'lucide-react'
import { COURSES_CATEGORIES } from '@/data/courses-categories'
import { request } from '@/lib/api'
import useCartStore from '@/store/cart.store'

// Cache of known Auchan slugs loaded once from API
let _auchanSlugsCache: Set<string> | null = null
async function getAuchanSlugs(): Promise<Set<string>> {
  if (_auchanSlugsCache) return _auchanSlugsCache
  try {
    const r = await request<{ categories: { slug: string }[] }>('/api/courses/nav')
    _auchanSlugsCache = new Set(r.categories.map((c) => c.slug))
  } catch {
    _auchanSlugsCache = new Set()
  }
  return _auchanSlugsCache
}

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

// Static pages with sub-categories (not direct Auchan product lists)
const STATIC_SLUGS = new Set(['halles'])

export default function CoursesCategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [isAuchan, setIsAuchan] = useState<boolean | null>(null)

  useEffect(() => {
    if (!slug) return
    if (STATIC_SLUGS.has(slug)) { setIsAuchan(false); return }
    getAuchanSlugs().then((s) => setIsAuchan(s.has(slug) || !COURSES_CATEGORIES[slug]))
  }, [slug])

  if (!slug) return <Navigate to="/courses" replace />

  // While resolving, show loading
  if (isAuchan === null) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 rounded-full border-4 border-emerald-400 border-t-transparent" /></div>

  if (isAuchan) return <AuchanProductList slug={slug} />

  const data = COURSES_CATEGORIES[slug]
  if (!data) return <Navigate to="/courses" replace />

  return (
    <main className="pb-16">
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-2xl">
          <Link to="/courses" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={15} /> Retour aux courses
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/30 shadow-lg shrink-0">
              <img src={data.image} alt={data.title} className="h-full w-full object-cover" />
            </div>
            <h1 className="text-3xl font-black text-white drop-shadow">{data.title}</h1>
          </div>
        </div>
      </div>
      <section className="container-edge pt-6">
        <div className="mx-auto max-w-2xl divide-y divide-line rounded-3xl border border-line bg-card overflow-hidden">
          {data.subcategories.map((sub) => (
            <Link key={sub.slug} to={`/courses/categorie/${slug}/${sub.slug}`}
              className="flex items-center gap-5 px-5 py-4 transition-colors hover:bg-surface-alt active:bg-surface-alt">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-alt">
                <img src={sub.image} alt={sub.label} className="h-full w-full object-contain p-1" loading="lazy" />
              </div>
              <span className="flex-1 text-base font-semibold text-ink">{sub.label}</span>
              <svg className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

function AuchanProductList({ slug }: { slug: string }) {
  const [label, setLabel] = useState(slug)
  useEffect(() => {
    request<{ categories: { slug: string; name: string }[] }>('/api/courses/nav')
      .then((r) => { const c = r.categories.find((x) => x.slug === slug); if (c) setLabel(c.name) })
      .catch(() => {})
  }, [slug])
  const [products, setProducts] = useState<AuchanProduct[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const LIMIT = 40

  const load = useCallback(async (p: number, query: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
      if (query) params.set('q', query)
      const data = await request<ApiResponse>(`/api/courses/${slug}?${params}`)
      setProducts(data.products)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load(1, '') }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(q)
    load(1, q)
  }

  function goPage(p: number) {
    setPage(p)
    load(p, search)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <main className="pb-16">
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/courses" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={15} /> Retour aux courses
          </Link>
          <div className="mt-2">
            <h1 className="text-3xl font-black text-white drop-shadow">{label}</h1>
            <p className="mt-1 text-white/80">{total} produit{total > 1 ? 's' : ''} disponibles</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container-edge pt-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:opacity-80 transition-opacity">
            Chercher
          </button>
        </form>
      </div>

      {/* Grid */}
      <section className="container-edge pt-5">
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
