import { useEffect, useState, useCallback } from 'react'
import { Search, Trash2, EyeOff, Eye, RefreshCw } from 'lucide-react'
import { request } from '@/lib/api'

interface Product {
  productId: string
  name: string
  brand: string | null
  price: number | null
  category: string | null
  imageUrl: string | null
  disabled: boolean
}

interface ApiResponse {
  total: number
  withPrice: number
  disabled: number
  page: number
  limit: number
  products: Product[]
}

const LIMIT = 50

export default function AdminAuchanPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [withPrice, setWithPrice] = useState(0)
  const [disabledCount, setDisabledCount] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [showDisabled, setShowDisabled] = useState(false)
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p: number, query: string, cat: string, disabled: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
      if (query) params.set('q', query)
      if (cat) params.set('category', cat)
      if (disabled) params.set('disabled', 'true')
      const data = await request<ApiResponse>(`/api/admin/auchan/products?${params}`)
      setProducts(data.products)
      setTotal(data.total)
      setWithPrice(data.withPrice)
      setDisabledCount(data.disabled)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1, '', '', false)
    // Load category list
    request<{ categories: { slug: string; name: string }[] }>('/api/courses/nav')
      .then((r) => setCategories(r.categories.map((c) => c.name)))
      .catch(() => {})
  }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(q)
    load(1, q, category, showDisabled)
  }

  function handleCategory(cat: string) {
    setCategory(cat)
    setPage(1)
    load(1, search, cat, showDisabled)
  }

  function handleToggleDisabled(show: boolean) {
    setShowDisabled(show)
    setPage(1)
    load(1, search, category, show)
  }

  function goPage(p: number) {
    setPage(p)
    load(p, search, category, showDisabled)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleDisable(product: Product) {
    const updated = await request<{ productId: string; disabled: boolean }>(
      `/api/admin/auchan/products/${product.productId}/disable`,
      { method: 'PATCH', body: { disabled: !product.disabled } },
    )
    setProducts((prev) => prev.map((p) => p.productId === updated.productId ? { ...p, disabled: updated.disabled } : p))
    setDisabledCount((n) => updated.disabled ? n + 1 : n - 1)
  }

  async function deleteProduct(productId: string) {
    if (!confirm('Supprimer définitivement ce produit ?')) return
    await request(`/api/admin/auchan/products/${productId}`, { method: 'DELETE' })
    setProducts((prev) => prev.filter((p) => p.productId !== productId))
    setTotal((n) => n - 1)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catalogue Auchan</h1>
        <p className="mt-1 text-sm text-muted">Gérez les produits scrapés — désactivez ceux indisponibles en magasin.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-surface p-4">
          <p className="text-2xl font-bold">{total.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-muted mt-0.5">produits total</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-2xl font-bold text-emerald-600">{withPrice.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-muted mt-0.5">avec prix</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-2xl font-bold text-orange-500">{disabledCount.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-muted mt-0.5">désactivés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-60">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
            />
          </div>
          <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-surface hover:opacity-80">
            Chercher
          </button>
        </form>

        <select
          value={category}
          onChange={(e) => handleCategory(e.target.value)}
          className="rounded-xl border border-line bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => handleToggleDisabled(!showDisabled)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${showDisabled ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-line bg-card text-muted hover:text-ink'}`}
        >
          <EyeOff size={14} />
          {showDisabled ? 'Masquer désactivés' : 'Voir désactivés'}
        </button>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin text-muted" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-muted text-sm">Aucun produit trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-left font-semibold">Produit</th>
                <th className="p-3 text-left font-semibold hidden sm:table-cell">Catégorie</th>
                <th className="p-3 text-right font-semibold">Prix</th>
                <th className="p-3 text-center font-semibold">Statut</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.productId} className={p.disabled ? 'opacity-50 bg-surface-alt/50' : ''}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-white border border-line shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-surface-alt shrink-0" />
                      )}
                      <div className="min-w-0">
                        {p.brand && <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{p.brand}</p>}
                        <p className="font-semibold text-ink truncate max-w-xs">{p.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-muted">{p.category ?? '—'}</span>
                  </td>
                  <td className="p-3 text-right font-bold">
                    {p.price != null ? `${p.price.toFixed(2)} €` : <span className="text-muted">—</span>}
                  </td>
                  <td className="p-3 text-center">
                    {p.disabled
                      ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">Désactivé</span>
                      : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Actif</span>
                    }
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => toggleDisable(p)}
                        title={p.disabled ? 'Réactiver' : 'Désactiver'}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${p.disabled ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50' : 'border-line text-muted hover:border-orange-300 hover:text-orange-500'}`}
                      >
                        {p.disabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => deleteProduct(p.productId)}
                        title="Supprimer définitivement"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => goPage(page - 1)} disabled={page === 1}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-semibold disabled:opacity-40 hover:bg-surface-alt">
            ← Précédent
          </button>
          <span className="text-sm text-muted">Page {page} / {totalPages}</span>
          <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-semibold disabled:opacity-40 hover:bg-surface-alt">
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
