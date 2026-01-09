import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/Shared/ScrollToTop'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Loader2 } from 'lucide-react'
import Login from './components/auth/Login'
import Home from './pages/Home/Home'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import PrivacyPolicy from './pages/Policies/PrivacyPolicy'
import Terms from './pages/Policies/Terms'
import RefundPolicy from './pages/Policies/RefundPolicy'
import TermsOfService from './pages/Policies/TermsOfService'
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
import AdminDataCleaner from './pages/Admin/AdminDataCleaner'

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

  // Strict role redirection
  if (user.role === 'admin' || user.role === 'superuser') {
    return <Navigate to="/admin" replace />
  }

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
    <ThemeProvider>
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
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/login" element={<Login />} />

            {/* Client Portal Routes */}
            <Route path="/dashboard" element={<PrivateRoute><ClientLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="services" replace />} />
              <Route path="services" element={<Services />} />
              <Route path="documents" element={<Documents />} />
              <Route path="history" element={<History />} />
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
              <Route path="data-cleaner" element={<AdminDataCleaner />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<div className="p-8 text-gray-500">Page Under Construction</div>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
