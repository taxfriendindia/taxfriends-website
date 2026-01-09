import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        console.log('Logging out from Navbar...')
        await signOut()
        navigate('/')
    }

    // Function to check if link is active
    const isActive = (path) => location.pathname === path ? "text-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/40" : "text-gray-600 dark:text-gray-300 hover:text-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20"

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-indigo-100/50 dark:border-gray-800 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                TF
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>
                        <span className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-700 transition-colors">TaxFriend India</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-3 lg:space-x-5">
                        <Link to="/" className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${isActive('/')}`}>Home</Link>
                        <Link to="/services" className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${isActive('/services')}`}>Services</Link>
                        <Link to="/about" className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${isActive('/about')}`}>About</Link>
                        <Link to="/contact" className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${isActive('/contact')}`}>Contact</Link>
                        <Link to="/privacy-policy" className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${isActive('/privacy-policy')}`}>Privacy Policy</Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <ThemeToggle />
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/dashboard" className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-full text-indigo-700 dark:text-indigo-300 font-bold transition-all border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                    <User size={18} />
                                    <span>Dashboard</span>
                                </Link>
                                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 font-bold text-sm transition-colors px-2">Logout</button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 dark:text-gray-300 font-bold hover:text-indigo-700 transition-colors">Login</Link>
                                <Link to="/login" className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center">
                                    Get Started <ArrowRight size={18} className="ml-2" />
                                </Link>
                            </>
                        )}
                    </div>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg transition-colors">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-indigo-100 dark:border-gray-800 shadow-2xl">
                        <div className="px-5 py-8 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Theme</span>
                                <ThemeToggle />
                            </div>
                            <Link to="/" className="block text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-700" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                            <Link to="/services" className="block text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-700" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
                            <Link to="/about" className="block text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-700" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                            <Link to="/contact" className="block text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-700" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
                            <Link to="/privacy-policy" className="block text-lg font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-700" onClick={() => setIsMobileMenuOpen(false)}>Privacy Policy</Link>

                            <div className="pt-6 border-t border-indigo-50 dark:border-gray-800">
                                {user ? (
                                    <Link to="/dashboard" className="block w-full py-4 text-center bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg" onClick={() => setIsMobileMenuOpen(false)}>Go to Dashboard</Link>
                                ) : (
                                    <div className="flex flex-col space-y-3">
                                        <Link to="/login" className="block w-full py-4 text-center bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                        <Link to="/login" className="block w-full py-4 text-center bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                                    </div>
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
