import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import CartDrawer from './CartDrawer'
import Toaster from '@/components/shared/Toaster'

interface LayoutProps {
  children: ReactNode
  hideShell?: boolean // hides navbar/footer (e.g. admin layout)
}

export default function Layout({ children, hideShell }: LayoutProps) {
  if (hideShell) {
    return (
      <div className="min-h-screen bg-surface text-ink">
        {children}
        <Toaster />
      </div>
    )
  }
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
      <CartDrawer />
      <Toaster />
    </div>
  )
}
