import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Bell, LogOut, Layout, FileText, Clock, User, ChevronRight, Briefcase, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const ClientLayout = () => {
    const { signOut, user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)

    // Navigation Items
    const navItems = [
        { path: '/dashboard/services', label: 'Services', icon: Briefcase },
        { path: '/dashboard/history', label: 'Track Status', icon: Clock }, // Renamed for clarity
        { path: '/dashboard/documents', label: 'Documents', icon: FileText },
        { path: '/dashboard/profile', label: 'Profile', icon: User },
    ]

    useEffect(() => {
        if (user) {
            fetchNotifications()
            // Optional: Subscribe to realtime notifications here
        }
    }, [user])

    // Close sidebar on route change (Mobile UX)
    useEffect(() => {
        setIsSidebarOpen(false)
    }, [location.pathname])

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.is_read).length)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const markAsRead = async (id) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)

            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error(error)
        }
    }

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-20 flex items-center px-8 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <span className="font-bold text-xl">TF</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">TaxFriends</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="ml-auto md:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {/* Admin Switcher for Super Admin */}
                    {user?.email === 'taxfriend.tax@gmail.com' && (
                        <NavLink
                            to="/admin/dashboard"
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all duration-200 mb-6 group"
                        >
                            <Shield className="w-5 h-5 flex-shrink-0" />
                            <span className="font-bold">Admin Panel</span>
                        </NavLink>
                    )}

                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`
                            }
                        >
                            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                            <span>{item.label}</span>
                            {item.path === '/dashboard/history' && (
                                <ChevronRight size={16} className="ml-auto opacity-50" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:pl-64 min-h-screen transition-all duration-300">

                {/* Header */}
                <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>

                    <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden md:block">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </h1>

                    <div className="flex items-center space-x-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors relative"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            <AnimatePresence>
                                {showNotifications && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setShowNotifications(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-40 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                                                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                                                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                                                    {unreadCount} New
                                                </span>
                                            </div>
                                            <div className="max-h-[60vh] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500">
                                                        <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">No notifications yet</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                        {notifications.map((notif) => (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => markAsRead(notif.id)}
                                                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                                                            >
                                                                <div className="flex items-start">
                                                                    <div className={`mt-1 w-2 h-2 rounded-full mr-3 flex-shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.title}</p>
                                                                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5 break-all">{notif.message}</p>
                                                                        <p className="text-xs text-gray-400 mt-2">
                                                                            {new Date(notif.created_at).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User Profile Snippet (Desktop) */}
                        <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                    {user?.user_metadata?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-0.5">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                    {/* Use avatar_url from metadata if available, else initial */}
                                    {user?.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-blue-600 text-lg">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>

            </div>
        </div>
    )
}

export default ClientLayout
