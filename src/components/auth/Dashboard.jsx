import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import { LogOut, User, Shield, Mail } from 'lucide-react'

const Dashboard = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome to Your Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your tax services and documents
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">User Profile</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.user_metadata?.full_name || 'No name provided'}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                {user?.email}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Status</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email_confirmed_at ? 'Verified ✅' : 'Pending Verification'}
              </p>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">🚀 Coming Soon</h2>
            <p className="text-blue-100 mb-4">
              Your complete tax management dashboard is under development.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="font-semibold">Service Tracking</div>
                <div className="opacity-90">Real-time progress updates</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="font-semibold">Document Upload</div>
                <div className="opacity-90">Secure file management</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="font-semibold">Expert Support</div>
                <div className="opacity-90">Direct CA communication</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
