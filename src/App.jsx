import { Routes, Route, useLocation } from 'react-router-dom'
import MenuPage from './pages/MenuPage.jsx'
import OrderReviewPage from './pages/OrderReviewPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import StatusPage from './pages/StatusPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminLoginPage from './admin/AdminLoginPage.jsx'
import AdminOrdersPage from './admin/AdminOrdersPage.jsx'
import AdminMenuPage from './admin/AdminMenuPage.jsx'
import AdminQrPage from './admin/AdminQrPage.jsx'
import AdminNewOrderPage from './admin/AdminNewOrderPage.jsx'
import AdminReportsPage from './admin/AdminReportsPage.jsx'
import AdminStaffPage from './admin/AdminStaffPage.jsx'
import AdminAccountPage from './admin/AdminAccountPage.jsx'

export default function App() {
  const location = useLocation()
  return (
    // Semua halaman /admin berbagi satu key supaya AdminLayout (sesi staf) tidak di-mount ulang.
    <div key={location.pathname.startsWith('/admin/') && location.pathname !== '/admin/login' ? '/admin' : location.pathname} className="route-transition">
      <Routes location={location}>
        <Route path="/" element={<MenuPage />} />
        <Route path="/order" element={<MenuPage />} />
        <Route path="/view-order" element={<OrderReviewPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/status/:id" element={<StatusPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Dashboard staf, terpisah dari alur pelanggan. */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOrdersPage />} />
          <Route path="pesanan-baru" element={<AdminNewOrderPage />} />
          <Route path="menu" element={<AdminMenuPage />} />
          <Route path="laporan" element={<AdminReportsPage />} />
          <Route path="qr" element={<AdminQrPage />} />
          <Route path="staf" element={<AdminStaffPage />} />
          <Route path="akun" element={<AdminAccountPage />} />
        </Route>
      </Routes>
    </div>
  )
}
