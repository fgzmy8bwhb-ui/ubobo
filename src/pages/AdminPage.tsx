import { useState } from 'react'
import { Download, RefreshCw, Trash2 } from 'lucide-react'

interface WaitlistEntry {
  email: string
  date: string
}

interface CourseOrder {
  list: string
  address: string
  phone: string
  payment: 'card' | 'cash'
  date: string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function exportCSV(rows: Record<string, string>[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = rows.map(row =>
    headers.map(h => `"${(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = '﻿' + [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted">
      Aucun {label} pour l'instant.
    </div>
  )
}

function SectionHeader({
  title, count, onRefresh, onExport, onClear,
}: {
  title: string
  count: number
  onRefresh: () => void
  onExport: () => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="rounded-full bg-ocean-light px-2.5 py-0.5 text-xs font-bold text-ocean">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-ocean hover:text-ocean transition-colors"
        >
          <RefreshCw size={12} />
          Actualiser
        </button>
        <button
          onClick={onExport}
          disabled={count === 0}
          className="flex items-center gap-1.5 rounded-md bg-ocean px-3 py-1.5 text-xs font-semibold text-white hover:bg-ocean-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={12} />
          Export CSV
        </button>
        <button
          onClick={onClear}
          disabled={count === 0}
          className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={12} />
          Vider
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)

  const waitlist: WaitlistEntry[] = (() => {
    try { return JSON.parse(localStorage.getItem('ubobo_waitlist') ?? '[]') } catch { return [] }
  })()

  const courses: CourseOrder[] = (() => {
    try { return JSON.parse(localStorage.getItem('ubobo_courses') ?? '[]') } catch { return [] }
  })()

  void tick

  const clearWaitlist = () => {
    if (confirm(`Supprimer les ${waitlist.length} entrées waitlist ?`)) {
      localStorage.removeItem('ubobo_waitlist')
      refresh()
    }
  }

  const clearCourses = () => {
    if (confirm(`Supprimer les ${courses.length} commandes de courses ?`)) {
      localStorage.removeItem('ubobo_courses')
      refresh()
    }
  }

  const exportWaitlist = () =>
    exportCSV(
      waitlist.map(e => ({ email: e.email, date: formatDate(e.date) })),
      `ubobo-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    )

  const exportCourses = () =>
    exportCSV(
      courses.map(c => ({
        date: formatDate(c.date),
        telephone: c.phone,
        adresse: c.address,
        paiement: c.payment === 'card' ? 'Carte' : 'Espèces',
        liste: c.list,
      })),
      `ubobo-courses-${new Date().toISOString().slice(0, 10)}.csv`
    )

  return (
    <main className="container-edge py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="mt-1 text-sm text-muted">Données stockées en localStorage — aucune authentification.</p>
        </div>
        <span className="shrink-0 rounded-md bg-sun/15 px-3 py-1.5 text-xs font-bold text-sun">
          DEV ONLY
        </span>
      </div>

      <div className="space-y-10">

        {/* Waitlist */}
        <section className="rounded-lg border border-line bg-white p-6">
          <SectionHeader
            title="Waitlist"
            count={waitlist.length}
            onRefresh={refresh}
            onExport={exportWaitlist}
            onClear={clearWaitlist}
          />

          {waitlist.length === 0 ? (
            <EmptyState label="inscrit" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="pb-3 pr-6">#</th>
                    <th className="pb-3 pr-6">Email</th>
                    <th className="pb-3">Date d'inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...waitlist].reverse().map((entry, i) => (
                    <tr key={i} className="hover:bg-surface transition-colors">
                      <td className="py-3 pr-6 text-muted">{waitlist.length - i}</td>
                      <td className="py-3 pr-6 font-medium">{entry.email}</td>
                      <td className="py-3 text-muted">{formatDate(entry.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Courses orders */}
        <section className="rounded-lg border border-line bg-white p-6">
          <SectionHeader
            title="Commandes de courses"
            count={courses.length}
            onRefresh={refresh}
            onExport={exportCourses}
            onClear={clearCourses}
          />

          {courses.length === 0 ? (
            <EmptyState label="commande" />
          ) : (
            <div className="space-y-4">
              {[...courses].reverse().map((order, i) => (
                <div
                  key={i}
                  className="rounded-md border border-line p-4 hover:border-ocean/30 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted">#{courses.length - i}</span>
                      <span className={[
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        order.payment === 'card'
                          ? 'bg-ocean-light text-ocean'
                          : 'bg-sand/60 text-ink',
                      ].join(' ')}>
                        {order.payment === 'card' ? '💳 Carte' : '💵 Espèces'}
                      </span>
                    </div>
                    <span className="text-xs text-muted">{formatDate(order.date)}</span>
                  </div>
                  <div className="grid gap-1 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Adresse</span>
                      <p className="mt-0.5">{order.address}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Téléphone</span>
                      <p className="mt-0.5">{order.phone}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">Liste</span>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink leading-relaxed">
                      {order.list}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
