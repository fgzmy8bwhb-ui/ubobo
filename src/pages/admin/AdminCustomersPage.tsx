import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { request } from '@/lib/api'
import { Button } from '@/components/ui'

interface Customer {
  id: string
  email: string
  name: string | null
  phone: string | null
  address: string | null
  createdAt: string
  _count: { orders: number }
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request<{ customers: Customer[] }>('/api/admin/customers')
      .then((d) => setCustomers(d.customers))
      .finally(() => setLoading(false))
  }, [])

  function exportCsv() {
    const lines = ['email,name,phone,address,orders,createdAt']
    for (const c of customers) {
      lines.push(`"${c.email}","${c.name ?? ''}","${c.phone ?? ''}","${c.address ?? ''}","${c._count.orders}","${c.createdAt}"`)
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ubobo-clients-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted">
            {customers.length} compte{customers.length === 1 ? '' : 's'} client créé{customers.length === 1 ? '' : 's'}.
          </p>
        </div>
        <Button onClick={exportCsv} disabled={customers.length === 0} icon={<Download size={14} />}>
          Export CSV
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : customers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-card p-10 text-center text-sm text-muted">
          Aucun client pour l'instant.
        </p>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Téléphone</th>
                <th className="px-5 py-3">Adresse</th>
                <th className="px-5 py-3">Commandes</th>
                <th className="px-5 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-surface-alt/40">
                  <td className="px-5 py-3 font-semibold">{c.name ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{c.email}</td>
                  <td className="px-5 py-3 text-muted">{c.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{c.address ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{c._count.orders}</td>
                  <td className="px-5 py-3 text-muted">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
