import { Routes, Route, useLocation } from 'react-router-dom'
import MenuPage from './pages/MenuPage.jsx'
import OrderReviewPage from './pages/OrderReviewPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import OrderSuccessPage from './pages/OrderSuccessPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import StatusPage from './pages/StatusPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'

export default function App() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="route-transition">
      <Routes location={location}>
        <Route path="/" element={<MenuPage />} />
        <Route path="/order" element={<MenuPage />} />
        <Route path="/view-order" element={<OrderReviewPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/order-success/:id" element={<OrderSuccessPage />} />
        <Route path="/status/:id" element={<StatusPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </div>
  )
}
