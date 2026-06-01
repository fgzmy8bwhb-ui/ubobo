import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { toast } from '@/hooks/useToast'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      toast.success('Bienvenue !')
      const redirect = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirect)
    } catch (err: any) {
      setError(err?.message === 'INVALID_CREDENTIALS' ? t('auth.invalidCredentials') : t('common.error'))
    }
  }

  return (
    <main className="container-edge py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-display">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-muted">{t('brand.tagline')}</p>

        <form onSubmit={onSubmit} className="mt-8 card-surface p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">{t('auth.email')}</label>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-flat" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">{t('auth.password')}</label>
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-flat" />
          </div>
          <Button type="submit" variant="dark" size="lg" fullWidth disabled={loading}>
            {loading ? t('common.loading') : t('auth.loginCta')}
          </Button>
          <p className="text-center text-sm text-muted">
            {t('auth.noAccount')}{' '}
            <Link to="/inscription" className="font-bold text-ink hover:underline">{t('auth.registerCta')}</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
