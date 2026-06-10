import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, LogIn, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useCartStore from '@/store/cart.store'
import ThemeToggle from '@/components/shared/ThemeToggle'
import LanguageSelector from '@/components/shared/LanguageSelector'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

export default function Navbar() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const openDrawer = useCartStore((s) => s.openDrawer)
  const totalItems = useCartStore((s) => s.totalItems())
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { to: '/categorie/petit-dejeuner', label: 'Petit Déjeuner' },
    { to: '/categorie/fruits-de-mer',  label: 'Fruits de Mer' },
    { to: '/categorie/huitres',        label: 'Huîtres' },
    { to: '/categorie/courses',        label: 'Courses' },
  ]

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 bg-card/85 backdrop-blur-xl transition-shadow duration-200',
          scrolled ? 'shadow-xs border-b border-line' : 'border-b border-transparent'
        )}
      >
        <nav className="container-edge flex h-16 items-center justify-between gap-3">
          <Link
            to="/"
            className="wordmark text-2xl shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            UBOBO
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'text-[15px] font-semibold transition-colors',
                    isActive ? 'text-ink' : 'text-muted hover:text-ink'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-1.5 md:flex">
            <Link
              to="/recherche"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-alt"
              aria-label={t('common.search')}
            >
              <Search size={18} />
            </Link>
            <ThemeToggle />
            <LanguageSelector />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  className="flex h-10 items-center gap-2 rounded-full bg-surface-alt px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-line"
                >
                  <User size={14} />
                  <span className="max-w-[90px] truncate">{user.name ?? user.email.split('@')[0]}</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-card shadow-lift">
                    <div className="border-b border-line px-4 py-3">
                      <p className="text-sm font-bold text-ink">{user.name ?? user.email}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                    <Link to="/commandes" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-surface-alt">{t('nav.orders')}</Link>
                    <Link to="/favoris" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-surface-alt">{t('nav.favorites')}</Link>
                    {user.role === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-sunset-500 hover:bg-surface-alt">{t('nav.admin')}</Link>
                    )}
                    <button
                      onClick={() => { logout(); setAccountOpen(false); navigate('/') }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-surface-alt"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/connexion">
                <button className="flex h-10 items-center gap-1.5 rounded-full bg-surface-alt px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-line">
                  <LogIn size={14} /> {t('nav.login')}
                </button>
              </Link>
            )}

            <button
              onClick={openDrawer}
              className="relative ml-1 flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-surface transition-opacity hover:opacity-90"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={15} />
              {totalItems > 0 && <span>{totalItems}</span>}
            </button>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={openDrawer}
              className="relative flex h-10 items-center gap-1.5 rounded-full bg-ink px-3 text-sm font-bold text-surface"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={15} />
              {totalItems > 0 && <span>{totalItems}</span>}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-16 z-20 border-b border-line bg-card/95 px-5 py-6 shadow-lift backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn('rounded-xl px-3 py-3 text-lg font-bold', isActive ? 'bg-surface-alt text-ink' : 'text-ink')
                  }
                >
                  {label}
                </NavLink>
              ))}
              <Link
                to="/recherche"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-lg font-bold text-ink"
              >
                <Search size={18} /> {t('common.search')}
              </Link>
              <Link
                to="/favoris"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-lg font-bold text-ink"
              >
                <Heart size={18} /> {t('nav.favorites')}
              </Link>

              <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                <LanguageSelector />
                <ThemeToggle />
              </div>

              {user ? (
                <>
                  <Link to="/commandes" onClick={() => setMenuOpen(false)} className="mt-2 block py-2 text-base font-semibold text-ink">{t('nav.orders')}</Link>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-base font-bold text-sunset-500">{t('nav.admin')}</Link>
                  )}
                  <button onClick={() => { logout(); setMenuOpen(false) }} className="block w-full py-2 text-left text-base font-semibold text-red-500">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link to="/connexion" onClick={() => setMenuOpen(false)} className="mt-2 block">
                  <button className="btn-primary w-full">{t('nav.login')}</button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
