import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        await signOut()
        navigate('/')
    }

    // Function to check if link is active
    const isActive = (path) => location.pathname === path ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-600 dark:text-gray-300 hover:text-blue-600"

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                            TF
                        </div>
                        <span className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">TaxFriend</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                        <Link to="/" className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive('/')}`}>Home</Link>
                        <Link to="/services" className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive('/services')}`}>Services</Link>
                        <Link to="/about" className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive('/about')}`}>About</Link>
                        <Link to="/contact" className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive('/contact')}`}>Contact</Link>
                        <Link to="/privacy-policy" className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive('/privacy-policy')}`}>Privacy Policy</Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/dashboard" className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 font-medium transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600">
                                    <User size={18} />
                                    <span>Dashboard</span>
                                </Link>
                                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 font-medium transition-colors">Logout</button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 dark:text-gray-300 font-bold hover:text-blue-600 transition-colors">Login</Link>
                                <Link to="/login" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center">
                                    Get Started <ArrowRight size={18} className="ml-2" />
                                </Link>
                            </>
                        )}
                    </div>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <div className="px-4 py-6 space-y-4">
                            <Link to="/" className="block text-lg font-medium text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                            <Link to="/services" className="block text-lg font-medium text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
                            <Link to="/about" className="block text-lg font-medium text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                            <Link to="/contact" className="block text-lg font-medium text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
                            <Link to="/privacy-policy" className="block text-lg font-medium text-gray-500 dark:text-gray-400" onClick={() => setIsMobileMenuOpen(false)}>Privacy Policy</Link>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                {user ? (
                                    <Link to="/dashboard" className="block w-full py-3 text-center bg-blue-50 text-blue-600 rounded-xl font-bold mb-3" onClick={() => setIsMobileMenuOpen(false)}>Go to Dashboard</Link>
                                ) : (
                                    <>
                                        <Link to="/login" className="block w-full py-3 text-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold mb-3" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                        <Link to="/login" className="block w-full py-3 text-center bg-blue-600 text-white rounded-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

export default Navbar
