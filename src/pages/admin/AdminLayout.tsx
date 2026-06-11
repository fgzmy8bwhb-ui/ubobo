import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  ClipboardList,
  Cog,
  LogOut,
  Mail,
  Moon,
  ShoppingCart,
  Store,
  Sun,
  Tag,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import LanguageSelector from '@/components/shared/LanguageSelector'

const navItems = [
  { to: '/admin', label: 'Tableau de bord', icon: BarChart3, end: true },
  { to: '/admin/orders', label: 'Commandes', icon: ClipboardList },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { to: '/admin/auchan', label: 'Courses Auchan', icon: ShoppingCart },
  { to: '/admin/promotions', label: 'Promotions', icon: Tag },
  { to: '/admin/waitlist', label: 'Liste d\'attente', icon: Mail },
  { to: '/admin/settings', label: 'Paramètres', icon: Cog },
]

export default function AdminLayout() {
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  const logout = useAuth((s) => s.logout)
  const { resolved, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!ready) return
    if (!user || user.role !== 'ADMIN') {
      navigate('/admin/login', { replace: true, state: { from: location.pathname } })
    }
  }, [user, ready, navigate, location.pathname])

  if (!ready) {
    return <div className="flex h-screen items-center justify-center bg-surface text-muted">Chargement…</div>
  }
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-line bg-card">
        <Link to="/" className="flex h-16 items-center gap-2 border-b border-line px-6">
          <span className="font-display text-xl font-bold text-ocean">Ubobo</span>
          <span className="rounded-md bg-sun/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sun">
            Admin
          </span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-ocean text-white' : 'text-ink hover:bg-surface-alt',
                ].join(' ')
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="mb-3 flex items-center gap-2">
            <LanguageSelector />
            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink hover:bg-surface-alt"
              aria-label="Theme"
            >
              {resolved === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
          <div className="rounded-lg bg-surface-alt p-3">
            <p className="text-xs font-bold">{user.name ?? 'Administrateur'}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:underline"
            >
              <LogOut size={12} /> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between border-b border-line bg-card px-4">
          <Link to="/" className="font-display text-lg font-bold text-ocean">
            Ubobo <span className="text-xs text-sun">Admin</span>
          </Link>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="text-xs font-semibold text-red-500"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="flex overflow-x-auto border-b border-line bg-card">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'shrink-0 px-4 py-3 text-xs font-semibold whitespace-nowrap',
                  isActive ? 'border-b-2 border-ocean text-ocean' : 'text-muted',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
