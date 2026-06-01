import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)

  const [email, setEmail] = useState('admin@ubobo.fr')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      const user = useAuth.getState().user
      if (user?.role !== 'ADMIN') {
        setError("Ce compte n'est pas administrateur.")
        return
      }
      toast.success('Bienvenue, admin')
      const dest = (location.state as { from?: string } | null)?.from ?? '/admin'
      navigate(dest, { replace: true })
    } catch {
      setError(t('auth.invalidCredentials'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-deep p-6">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-lift">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ocean text-white">
            <LogIn size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sun">Admin</p>
            <h1 className="text-xl font-bold">Ubobo</h1>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('auth.email')}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('auth.password')}</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" autoComplete="current-password" />
          </div>
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? t('common.loading') : t('auth.loginCta')}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          Compte par défaut (dev) : admin@ubobo.fr / admin123
        </p>
      </div>
    </div>
  )
}
