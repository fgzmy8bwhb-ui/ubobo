import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-edge py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Link to="/" className="wordmark text-2xl">UBOBO</Link>
            <p className="mt-2 max-w-md text-sm text-muted">
              Livraison locale sur la Pointe du Cap Ferret · Lège-Cap-Ferret, Gironde 33970.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <Link to="/restaurants" className="hover:text-ink">{t('nav.restaurants')}</Link>
            <Link to="/courses" className="hover:text-ink">{t('nav.courses')}</Link>
            <Link to="/recherche" className="hover:text-ink">{t('common.search')}</Link>
            <a href="#" className="hover:text-ink">CGU</a>
            <a href="#" className="hover:text-ink">Légal</a>
            <a href="#" className="hover:text-ink">Contact</a>
          </nav>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-line pt-6 text-xs text-subtle sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} UBOBO. Tous droits réservés.</p>
          <p>Fait avec soin sur la Pointe du Cap Ferret.</p>
        </div>
      </div>
    </footer>
  )
}
