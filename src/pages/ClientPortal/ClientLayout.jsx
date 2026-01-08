import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Bell, LogOut, Layout, FileText, Clock, User, ChevronRight, Briefcase, CheckCircle, AlertCircle, Shield, Trash2 } from 'lucide-react'
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
    const [imgError, setImgError] = useState(false)
    const [toast, setToast] = useState(null)
    const [profileIncomplete, setProfileIncomplete] = useState(false)
    const [dismissTimer, setDismissTimer] = useState(5)

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

            // Check for profile completeness (Allow either mobile field key)
            const hasMobile = user.mobile_number || user.mobile;
            const isIncomplete = !user.full_name || !hasMobile
            const isAtProfilePage = location.pathname.includes('/profile')

            if (isIncomplete && !isAtProfilePage) {
                setProfileIncomplete(true)
            } else {
                setProfileIncomplete(false)
            }

            // 1. Personal Channel (Specific to User)
            const personalChannel = supabase
                .channel(`notif:personal:${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    (payload) => handleIncomingNotif(payload.new)
                )
                .subscribe()

            // 2. Global Channel (For Broadcasts)
            const globalChannel = supabase
                .channel('notif:global')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=is.null` },
                    (payload) => handleIncomingNotif(payload.new)
                )
                .subscribe()

            const handleIncomingNotif = (newNotif) => {
                // Check if already dismissed (unlikely for new but safe)
                const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]')
                if (dismissed.includes(newNotif.id)) return

                setNotifications(prev => [newNotif, ...prev])
                setUnreadCount(prev => prev + 1)
                setToast(newNotif)
                setTimeout(() => setToast(null), 5000)
            }

            return () => {
                supabase.removeChannel(personalChannel)
                supabase.removeChannel(globalChannel)
            }
        }
    }, [user])

    // Auto-dismiss countdown for profile warning
    useEffect(() => {
        let interval;
        if (profileIncomplete && dismissTimer > 0) {
            interval = setInterval(() => {
                setDismissTimer((prev) => prev - 1)
            }, 1000)
        } else if (profileIncomplete && dismissTimer === 0) {
            setProfileIncomplete(false) // Auto dismiss
        }
        return () => clearInterval(interval)
    }, [profileIncomplete, dismissTimer])

    // Close sidebar on route change (Mobile UX)
    useEffect(() => {
        setIsSidebarOpen(false)
    }, [location.pathname])

    const fetchNotifications = async () => {
        try {
            // Rule: Auto-expire broadcasts older than 7 days for lightweight DB
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or(`user_id.eq.${user.id},user_id.is.null`)
                .gt('created_at', sevenDaysAgo.toISOString()) // Filter old notifications
                .order('created_at', { ascending: false })
                .limit(50) // Increased limit for better coverage

            if (data) {
                // Filter out locally dismissed broadcasts
                const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]')
                const visible = data.filter(n => !dismissed.includes(n.id))

                setNotifications(visible)
                setUnreadCount(visible.filter(n => !n.is_read).length)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const markAsRead = async (id) => {
        try {
            // Only update DB if it's a personal notification
            const notif = notifications.find(n => n.id === id)
            if (notif && notif.user_id) {
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', id)
            }
            // For broadcasts, we just mark locally read in state (persisting read state for broadcasts is harder without a separate table)

            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error(error)
        }
    }

    const deleteNotification = async (e, id) => {
        e.stopPropagation()
        const notif = notifications.find(n => n.id === id)

        // Optimistic UI Update
        setNotifications(prev => {
            const newNotes = prev.filter(n => n.id !== id)
            setUnreadCount(newNotes.filter(n => !n.is_read).length)
            return newNotes
        })

        // Always dismiss locally to ensure it doesn't reappear on refresh
        try {
            const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]')
            if (!dismissed.includes(id)) {
                dismissed.push(id)
                localStorage.setItem('dismissed_notifs', JSON.stringify(dismissed))
            }

            // If Personal, also try to delete from DB
            if (notif && notif.user_id) {
                const { error } = await supabase
                    .from('notifications')
                    .delete()
                    .eq('id', id)
                if (error) console.error('DB Delete Error:', error)
            }
        } catch (error) {
            console.error('Error handling notification delete:', error)
        }
    }

    const clearAllNotifications = async () => {
        // 1. Identify Personal vs Broadcast
        const personalIds = notifications.filter(n => n.user_id).map(n => n.id)
        const broadcastIds = notifications.filter(n => !n.user_id).map(n => n.id)

        // Optimistic Clear
        setNotifications([])
        setUnreadCount(0)

        try {
            // 2. Delete ALL Personal Notifications from DB for this user
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error;



            // 4. Dismiss ALL currently loaded Broadcasts in LocalStorage
            if (broadcastIds.length > 0) {
                const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]')
                const newDismissed = [...new Set([...dismissed, ...broadcastIds])]
                localStorage.setItem('dismissed_notifs', JSON.stringify(newDismissed))
            }
        } catch (error) {
            console.error('Error clearing:', error)
        }
    }

    // Auto-mark as read when dropdown opens
    useEffect(() => {
        if (showNotifications && unreadCount > 0) {
            const markAllRead = async () => {
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
                if (unreadIds.length > 0) {
                    await supabase
                        .from('notifications')
                        .update({ is_read: true })
                        .in('id', unreadIds)

                    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                    setUnreadCount(0)
                }
            }
            markAllRead()
        }
    }, [showNotifications])

    const handleLogout = async () => {
        try {
            await signOut()
            navigate('/login')
        } catch (error) {
            console.error('Logout error:', error)
            navigate('/login')
        }
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
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-indigo-100/50 dark:border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-20 flex items-center justify-center px-4 border-b border-indigo-100/50 dark:border-gray-800 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
                    <Link to="/dashboard" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform duration-500">
                                TF
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>
                        <span className="font-black text-lg text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                            TaxFriend India
                        </span>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="ml-auto md:hidden text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                        {/* Admin Switcher for Super Admin & Admins */}
                        {(user?.role === 'admin' || user?.role === 'superuser') && (
                            <NavLink
                                to="/admin/dashboard"
                                className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:from-indigo-800 hover:to-indigo-900 transition-all duration-200 mb-6 group"
                            >
                                <Shield className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
                                <span className="font-black text-sm uppercase tracking-wider">Admin Panel</span>
                            </NavLink>
                        )}

                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm border border-indigo-100/50 dark:border-indigo-800'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 font-semibold'
                                    }`
                                }
                            >
                                <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                                <span>{item.label}</span>
                                {item.path === '/dashboard/history' && (
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-indigo-100/50 dark:border-gray-800 bg-gradient-to-b from-transparent to-indigo-50/30 dark:to-indigo-950/10">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-3 w-full text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-bold border border-transparent hover:border-rose-200 dark:hover:border-rose-800 shadow-sm hover:shadow-md"
                        >
                            <LogOut size={20} className="flex-shrink-0" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:pl-64 min-h-screen transition-all duration-300">

                {/* Header */}
                <header className="h-20 bg-white dark:bg-gray-900 border-b border-indigo-100/50 dark:border-gray-800 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2.5 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <Menu size={22} />
                    </button>

                    <h1 className="text-xl font-black text-gray-900 dark:text-white hidden md:block tracking-tight">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </h1>

                    <div className="flex items-center space-x-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2.5 text-gray-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl transition-all relative group"
                            >
                                <Bell size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
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
                                            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-indigo-100/50 dark:border-gray-700 z-40 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-indigo-100/50 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-gray-900 dark:text-white">Notifications</h3>
                                                    {unreadCount > 0 && (
                                                        <span className="text-xs text-indigo-700 font-black bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 px-2.5 py-1 rounded-full">
                                                            {unreadCount} New
                                                        </span>
                                                    )}
                                                </div>
                                                {notifications.length > 0 && (
                                                    <button
                                                        onClick={clearAllNotifications}
                                                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-[60vh] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500">
                                                        <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm font-medium">No notifications yet</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-indigo-50/50 dark:divide-gray-700">
                                                        {notifications.map((notif) => (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => markAsRead(notif.id)}
                                                                className={`p-4 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors relative group ${!notif.is_read ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                                                            >
                                                                <div className="flex items-start pr-6">
                                                                    <div className={`mt-1 w-2 h-2 rounded-full mr-3 flex-shrink-0 ${!notif.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                                                    <div>
                                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{notif.title}</p>
                                                                        <p className="text-sm text-gray-500 mt-0.5 break-words">{notif.message}</p>
                                                                        <p className="text-xs text-gray-400 mt-2">
                                                                            {new Date(notif.created_at).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => deleteNotification(e, notif.id)}
                                                                    className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
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
                        {/* User Profile Snippet (Desktop) */}
                        <Link
                            to="/dashboard/profile"
                            className="hidden sm:flex items-center space-x-3 pl-4 border-l border-indigo-100/50 dark:border-gray-800 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 py-1 px-3 rounded-xl transition-all group"
                        >
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                                    {user?.user_metadata?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 group-hover:from-indigo-700 group-hover:to-emerald-600 transition-all shadow-md">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    {/* Use avatar_url from metadata if available, else initial */}
                                    {user?.user_metadata?.avatar_url && !imgError ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={() => setImgError(true)}
                                        />
                                    ) : (
                                        <span className="font-black text-indigo-700 text-lg">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-transparent">
                    <Outlet />
                </main>

            </div>

            {/* Realtime Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: 50 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 20, x: 20 }}
                        className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-indigo-100/50 dark:border-gray-700 p-4 max-w-sm flex items-start gap-4"
                    >
                        <div className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 p-2.5 rounded-xl mt-1 shadow-sm">
                            <Bell size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-gray-900 dark:text-white text-sm">{toast.title}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2 font-medium">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ClientLayout
