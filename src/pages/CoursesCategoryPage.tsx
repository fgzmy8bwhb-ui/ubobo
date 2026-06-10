import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { COURSES_CATEGORIES } from '@/data/courses-categories'

export default function CoursesCategoryPage() {
  const { slug } = useParams<{ slug: string }>()

  const data = COURSES_CATEGORIES[slug ?? '']

  if (!data) {
    return <Navigate to="/courses" replace />
  }

  return (
    <main className="pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/courses"
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
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

      {/* Subcategory list */}
      <section className="container-edge pt-6">
        <div className="mx-auto max-w-2xl divide-y divide-line rounded-3xl border border-line bg-card overflow-hidden">
          {data.subcategories.map((sub) => (
            <Link
              key={sub.slug}
              to={`/courses/categorie/${slug}/${sub.slug}`}
              className="flex items-center gap-5 px-5 py-4 transition-colors hover:bg-surface-alt active:bg-surface-alt"
            >
              {/* Product image */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-alt">
                <img
                  src={sub.image}
                  alt={sub.label}
                  className="h-full w-full object-contain p-1"
                  loading="lazy"
                />
              </div>
              {/* Label */}
              <span className="flex-1 text-base font-semibold text-ink">{sub.label}</span>
              {/* Arrow */}
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
