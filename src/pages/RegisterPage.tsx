import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { toast } from '@/hooks/useToast'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const register = useAuth((s) => s.register)
  const loading = useAuth((s) => s.loading)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await register(email, password, name || undefined, phone || undefined)
      toast.success('Compte créé !')
      navigate('/')
    } catch (err: any) {
      setError(err?.message === 'EMAIL_EXISTS' ? t('auth.emailExists') : t('common.error'))
    }
  }

  return (
    <main className="container-edge py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-display">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-muted">{t('brand.tagline')}</p>

        <form onSubmit={onSubmit} className="mt-8 card-surface p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.email')} className="input-flat" />
          <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.name')} className="input-flat" />
          <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('auth.phone')} className="input-flat" />
          <input type="password" required autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.password')} className="input-flat" />
          <Button type="submit" variant="dark" size="lg" fullWidth disabled={loading}>
            {loading ? t('common.loading') : t('auth.registerCta')}
          </Button>
          <p className="text-center text-sm text-muted">
            {t('auth.haveAccount')}{' '}
            <Link to="/connexion" className="font-bold text-ink hover:underline">{t('auth.loginCta')}</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
