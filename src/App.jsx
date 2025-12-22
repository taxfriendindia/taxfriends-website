import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/Shared/ScrollToTop'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import Login from './components/auth/Login'
import Home from './pages/Home/Home'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy'
import Terms from './pages/Policies/Terms'
import ClientLayout from './pages/ClientPortal/ClientLayout'
import Services from './pages/ClientPortal/Services'
import Documents from './pages/ClientPortal/Documents'
import History from './pages/ClientPortal/History'
import Profile from './pages/ClientPortal/Profile'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminClients from './pages/Admin/AdminClients'
import AdminRequests from './pages/Admin/AdminRequests'
import AdminServices from './pages/Admin/AdminServices'
import AdminRecords from './pages/Admin/AdminRecords'
import AdminAnnouncements from './pages/Admin/AdminAnnouncements'
import AdminPartners from './pages/Admin/AdminPartners'
import PartnerProgram from './pages/Partner/PartnerProgram'
import PartnerLayout from './pages/Partner/PartnerLayout'
import PartnerDashboard from './pages/Partner/PartnerDashboard'
import ClientOnboarding from './pages/Partner/ClientOnboarding'
import PartnerClients from './pages/Partner/PartnerClients'
import WalletHistory from './pages/Partner/WalletHistory'

import PublicServices from './pages/Services/Services'

// Loading Spinner Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
  </div>
)

// Standard Private Route (Any logged in user)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" />

  // Admins are allowed to access Client Portal to view their own personal history
  // Removed redirection logic that blocked admins.

  return children
}

// Partner Protected Route
const PartnerRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'partner') return <Navigate to="/dashboard" replace />
  return children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'admin' && user.role !== 'superuser') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}



function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<PublicServices />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/partner-program" element={<PartnerProgram />} />
          <Route path="/login" element={<Login />} />

          {/* Client Portal Routes */}
          <Route path="/dashboard" element={<PrivateRoute><ClientLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="services" replace />} />
            <Route path="services" element={<Services />} />
            <Route path="documents" element={<Documents />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Partner Portal Routes (Protected) */}
          <Route path="/partner" element={<PartnerRoute><PartnerLayout /></PartnerRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PartnerDashboard />} />
            <Route path="onboard" element={<ClientOnboarding />} />
            <Route path="clients" element={<PartnerClients />} />
            <Route path="wallet" element={<WalletHistory />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin Portal Routes (Protected) */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="documents" element={<AdminRequests />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="records" element={<AdminRecords />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="partners" element={<AdminPartners />} />
            {/* Manage Admins merged into Admin Services */}
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<div className="p-8 text-gray-500">Page Under Construction</div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
