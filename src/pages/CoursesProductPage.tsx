import { useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react'
import { COURSES_PRODUCTS, type CourseProduct } from '@/data/courses-products'
import { COURSES_CATEGORIES } from '@/data/courses-categories'
import useCartStore from '@/store/cart.store'

export default function CoursesProductPage() {
  const { category, subcategory } = useParams<{ category: string; subcategory: string }>()

  const products = COURSES_PRODUCTS[category ?? '']?.[subcategory ?? '']

  if (!products) return <Navigate to="/courses" replace />

  const catData = COURSES_CATEGORIES[category ?? '']
  const subData = catData?.subcategories.find((s) => s.slug === subcategory)

  // Collect unique tags for filter pills
  const allTags = Array.from(new Set(products.flatMap((p) => p.tags ?? [])))
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = activeTag ? products.filter((p) => p.tags?.includes(activeTag)) : products

  return (
    <main className="pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-4 pt-6 pb-10">
        <div className="mx-auto max-w-3xl">
          <Link
            to={`/courses/categorie/${category}`}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={15} /> {catData?.title ?? 'Retour'}
          </Link>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow">
                {subData?.label ?? subcategory}
              </h1>
              <p className="mt-1 text-white/80">{products.length} produit{products.length > 1 ? 's' : ''}</p>
            </div>
            {subData?.image && (
              <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/30 shadow-lg shrink-0">
                <img src={subData.image} alt={subData.label} className="h-full w-full object-contain p-1" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter pills */}
      {allTags.length > 0 && (
        <div className="container-edge pt-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTag(null)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                !activeTag
                  ? 'border-ink bg-ink text-surface'
                  : 'border-line bg-card text-ink hover:border-ink/40'
              }`}
            >
              Tous
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeTag === tag
                    ? 'border-ink bg-ink text-surface'
                    : 'border-line bg-card text-ink hover:border-ink/40'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product grid */}
      <section className="container-edge pt-5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted">Aucun produit dans cette catégorie.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ProductCard({ product }: { product: CourseProduct }) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const cartItem = items.find((i) => i.id === product.id)
  const qty = cartItem?.quantity ?? 0

  function handleAdd() {
    addItem(
      {
        id: product.id,
        name: product.brand ? `${product.brand} ${product.name}` : product.name,
        description: product.weight + (product.pieces ? ` · ${product.pieces}` : ''),
        price: product.price,
        category: 'courses',
        available: true,
        image: product.image,
      },
      'auchan-lege',
      'Auchan Lège-Cap-Ferret',
    )
  }

  function handleIncrease() {
    updateQty(product.id, qty + 1)
  }

  function handleDecrease() {
    if (qty <= 1) removeItem(product.id)
    else updateQty(product.id, qty - 1)
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      {/* Image */}
      <div className="relative bg-white p-3 aspect-square">
        {product.isFresh && (
          <span className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-black uppercase text-white shadow-sm leading-none text-center">
            FRAIS
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/categories/halles.jpeg'
          }}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{product.brand}</p>
        )}
        <p className="text-xs font-semibold text-ink leading-snug line-clamp-2">{product.name}</p>
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          <span className="rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] text-muted">{product.weight}</span>
          {product.pieces && (
            <span className="rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] text-muted">{product.pieces}</span>
          )}
        </div>
        {product.pricePerKg && (
          <p className="text-[10px] text-muted">{product.pricePerKg}</p>
        )}
      </div>

      {/* Price + Add */}
      <div className="flex items-center justify-between border-t border-line px-3 py-2.5">
        <span className="text-base font-black text-ink">{product.price.toFixed(2)}€</span>

        {qty === 0 ? (
          <button
            onClick={handleAdd}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-surface transition-transform active:scale-90 hover:opacity-80"
          >
            <ShoppingCart size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDecrease}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-alt text-ink hover:bg-card transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-5 text-center text-sm font-bold text-ink">{qty}</span>
            <button
              onClick={handleIncrease}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-surface hover:opacity-80 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
