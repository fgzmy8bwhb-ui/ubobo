import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { request } from '@/lib/api'
import { Button } from '@/components/ui'

interface WaitlistEntry {
  id: string
  email: string
  source?: string | null
  createdAt: string
}

export default function AdminWaitlistPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request<{ entries: WaitlistEntry[] }>('/api/waitlist')
      .then((d) => setEntries(d.entries))
      .finally(() => setLoading(false))
  }, [])

  function exportCsv() {
    const lines = ['email,source,createdAt']
    for (const e of entries) {
      lines.push(`"${e.email}","${e.source ?? ''}","${e.createdAt}"`)
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ubobo-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.waitlist')}</h1>
          <p className="mt-1 text-sm text-muted">Inscrits à la liste d'attente pré-lancement.</p>
        </div>
        <Button onClick={exportCsv} disabled={entries.length === 0} icon={<Download size={14} />}>
          Export CSV
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-card p-10 text-center text-sm text-muted">
          Aucun inscrit pour l'instant.
        </p>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((e, i) => (
                <tr key={e.id} className="hover:bg-surface-alt/40">
                  <td className="px-5 py-3 text-muted">{entries.length - i}</td>
                  <td className="px-5 py-3 font-semibold">{e.email}</td>
                  <td className="px-5 py-3 text-muted">{e.source ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{new Date(e.createdAt).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
