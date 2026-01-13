import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/Shared/ScrollToTop'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Loader2 } from 'lucide-react'
import Portfolio from './pages/Portfolio/Portfolio'

// Lazy Loading Components for better performance
const Login = lazy(() => import('./components/auth/Login'))
const Home = lazy(() => import('./pages/Home/Home'))
const About = lazy(() => import('./pages/About/About'))
const Contact = lazy(() => import('./pages/Contact/Contact'))
const PrivacyPolicy = lazy(() => import('./pages/Policies/PrivacyPolicy'))
const RefundPolicy = lazy(() => import('./pages/Policies/RefundPolicy'))
const TermsOfService = lazy(() => import('./pages/Policies/TermsOfService'))
const ShippingPolicy = lazy(() => import('./pages/Policies/ShippingPolicy'))
const ClientLayout = lazy(() => import('./pages/ClientPortal/ClientLayout'))
const Services = lazy(() => import('./pages/ClientPortal/Services'))
const Documents = lazy(() => import('./pages/ClientPortal/Documents'))
const History = lazy(() => import('./pages/ClientPortal/History'))
const Profile = lazy(() => import('./pages/ClientPortal/Profile'))
const Records = lazy(() => import('./pages/ClientPortal/Records'))
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminClients = lazy(() => import('./pages/Admin/AdminClients'))
const AdminRequests = lazy(() => import('./pages/Admin/AdminRequests'))
const AdminServices = lazy(() => import('./pages/Admin/AdminServices'))
const AdminRecords = lazy(() => import('./pages/Admin/AdminRecords'))
const AdminAnnouncements = lazy(() => import('./pages/Admin/AdminAnnouncements'))
const AdminDataCleaner = lazy(() => import('./pages/Admin/AdminDataCleaner'))
const AdminLeads = lazy(() => import('./pages/Admin/AdminLeads'))
const PublicServices = lazy(() => import('./pages/Services/Services'))

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
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<PublicServices />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/login" element={<Login />} />

              {/* Client Portal Routes */}
              <Route path="/dashboard" element={<PrivateRoute><ClientLayout /></PrivateRoute>}>
                <Route index element={<Navigate to="services" replace />} />
                <Route path="services" element={<Services />} />
                <Route path="documents" element={<Documents />} />
                <Route path="history" element={<History />} />
                <Route path="records" element={<Records />} />
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
                <Route path="leads" element={<AdminLeads />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<div className="p-8 text-gray-500">Page Under Construction</div>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
