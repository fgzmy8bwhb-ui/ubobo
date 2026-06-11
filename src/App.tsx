import { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from './components/layout'

const HomePage = lazy(() => import('./pages/HomePage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const RestaurantsPage = lazy(() => import('./pages/RestaurantsPage'))
const RestaurantDetailPage = lazy(() => import('./pages/RestaurantDetailPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CoursesCategoryPage = lazy(() => import('./pages/CoursesCategoryPage'))
const CoursesProductPage = lazy(() => import('./pages/CoursesProductPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'))
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'))

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminRestaurantsPage = lazy(() => import('./pages/admin/AdminRestaurantsPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))
const AdminPromotionsPage = lazy(() => import('./pages/admin/AdminPromotionsPage'))
const AdminWaitlistPage = lazy(() => import('./pages/admin/AdminWaitlistPage'))
const AdminAuchanPage = lazy(() => import('./pages/admin/AdminAuchanPage'))

function AnimatedRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  const inner = (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categorie/:slug" element={<CategoryPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/categorie/:slug" element={<CoursesCategoryPage />} />
        <Route path="/courses/categorie/:category/:subcategory" element={<CoursesProductPage />} />
        <Route path="/recherche" element={<SearchPage />} />
        <Route path="/favoris" element={<FavoritesPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/commande" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/suivi/:orderNumber" element={<OrderTrackingPage />} />
        <Route path="/commandes" element={<MyOrdersPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="restaurants" element={<AdminRestaurantsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="auchan" element={<AdminAuchanPage />} />
          <Route path="waitlist" element={<AdminWaitlistPage />} />
        </Route>
      </Routes>
    </Suspense>
  )

  if (isAdmin) {
    // Admin has its own chrome; render without customer Navbar/Footer.
    return (
      <Layout hideShell>
        {inner}
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {inner}
      </motion.div>
    </Layout>
  )
}

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ocean border-t-transparent" />
    </div>
  )
}

export default function App() {
  return <AnimatedRoutes />
}
