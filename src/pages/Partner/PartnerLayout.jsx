import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, FilePlus, Wallet, LogOut, Menu, X, Shield, ChevronLeft, ChevronRight, Bell, UserPlus, User
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

const PartnerLayout = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        if (user) {
            fetchNotifications()

            // 1. Personal Channel (Specific to User)
            const personalChannel = supabase
                .channel(`notif:partner:${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    (payload) => handleIncomingNotif(payload.new)
                )
                .subscribe()

            // 2. Global System Channel
            const systemChannel = supabase
                .channel('notif:system')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `type=eq.system` },
                    (payload) => handleIncomingNotif(payload.new)
                )
                .subscribe()

            return () => {
                supabase.removeChannel(personalChannel)
                supabase.removeChannel(systemChannel)
            }
        }
    }, [user])

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or(`user_id.eq.${user.id},type.eq.system`)
                .order('created_at', { ascending: false })
                .limit(20)

            if (!error && data) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.is_read).length)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const handleIncomingNotif = (notif) => {
        setNotifications(prev => [notif, ...prev])
        setUnreadCount(prev => prev + 1)
        setToast({ title: notif.title, message: notif.message })
        setTimeout(() => setToast(null), 5000)
    }

    const markAsRead = async (id) => {
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error(error)
        }
    }

    const clearAllNotifications = async () => {
        try {
            await supabase.from('notifications').delete().eq('user_id', user.id)
            setNotifications([])
            setUnreadCount(0)
        } catch (error) {
            console.error(error)
        }
    }

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    if (!user || user.role !== 'partner') {
        // Fallback for unauthorized access
        return <div className="p-10 text-center">Redirecting...</div>
    }

    const navItems = [
        { to: '/partner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/partner/clients', icon: Users, label: 'My Clients' },
        { to: '/partner/onboard', icon: UserPlus, label: 'Onboard Node' },
        { to: '/partner/wallet', icon: Wallet, label: 'Wallet & Payouts' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop')] bg-cover bg-fixed relative overflow-hidden">
            {/* Overlay */}
            <div className="fixed inset-0 bg-slate-100/90 backdrop-blur-sm z-0 pointer-events-none"></div>

            {/* Sidebar (Desktop) */}
            <aside
                onMouseEnter={() => setSidebarOpen(true)}
                onMouseLeave={() => setSidebarOpen(false)}
                className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out border-r border-white/20 shadow-2xl ${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col
                bg-slate-900/80 backdrop-blur-md text-white`}
            >
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 relative">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center w-full'}`}>
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg flex-shrink-0 shadow-lg shadow-blue-500/20">
                            <span className="font-bold text-lg">TF</span>
                        </div>
                        <div className={`flex flex-col transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            <span className="font-bold text-lg leading-tight text-white">TaxFriends</span>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">City Partner</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center p-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                } ${!isSidebarOpen && 'justify-center'}`
                            }
                            title={!isSidebarOpen ? item.label : ''}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 bg-slate-900/60 backdrop-blur-md space-y-3">
                    <NavLink
                        to="/partner/profile"
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                            } ${!isSidebarOpen && 'justify-center'}`
                        }
                        title={!isSidebarOpen ? "My Profile" : ''}
                    >
                        <User size={20} className="flex-shrink-0" />
                        <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            My Profile
                        </span>
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white group border border-rose-500/20 shadow-lg shadow-rose-500/5 ${!isSidebarOpen && 'justify-center'}`}
                        title="Logout System"
                    >
                        <LogOut size={20} className="shrink-0 group-hover:scale-120 transition-transform" />
                        <span className={`ml-4 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 w-0 -translate-x-4 hidden'}`}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Header */}
                <header className="h-20 bg-white/40 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-black/5 rounded-lg text-slate-600"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">
                            {navItems.find(i => i.to === location.pathname)?.label || 'Partner Portal'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative group"
                            >
                                <Bell size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            <AnimatePresence>
                                {showNotifications && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-40 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                                <h3 className="font-bold text-slate-900">Notifications</h3>
                                                {notifications.length > 0 && (
                                                    <button onClick={clearAllNotifications} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All</button>
                                                )}
                                            </div>
                                            <div className="max-h-[60vh] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-500">
                                                        <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">No notifications yet</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-50">
                                                        {notifications.map((notif) => (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => markAsRead(notif.id)}
                                                                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors relative group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                                            >
                                                                <div className="flex items-start pr-6">
                                                                    <div className={`mt-1.5 w-2 h-2 rounded-full mr-3 flex-shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                                                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                                                                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(notif.created_at).toLocaleString()}</p>
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

                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-sm font-black text-slate-900">{user.full_name || 'Partner Account'}</span>
                            <span className="text-[10px] text-blue-500 uppercase tracking-widest font-black">Verified Partner</span>
                        </div>
                        <div
                            onClick={() => navigate('/partner/profile')}
                            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black border-2 border-white shadow-xl overflow-hidden active:scale-95 transition-transform cursor-pointer"
                        >
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (user.full_name?.charAt(0) || 'P').toUpperCase()
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className="fixed inset-y-0 left-0 w-72 bg-white z-[70] lg:hidden flex flex-col p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">P</div>
                                    <span className="font-bold text-xl tracking-tight">Partner Hub</span>
                                </div>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={24} /></button>
                            </div>

                            <nav className="space-y-4">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center p-4 rounded-2xl font-bold transition-all ${isActive
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                                : 'text-slate-600 hover:bg-slate-100'
                                            }`
                                        }
                                    >
                                        <item.icon size={22} className="mr-4" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>

                            <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
                                <NavLink
                                    to="/partner/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center p-4 rounded-2xl font-bold transition-all ${isActive
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`
                                    }
                                >
                                    <User size={22} className="mr-4" /> My Profile
                                </NavLink>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center p-4 w-full text-rose-500 bg-rose-50 rounded-2xl font-bold"
                                >
                                    <LogOut size={22} className="mr-4" /> Logout System
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
            {/* Realtime Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: 50 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 20, x: 20 }}
                        className="fixed bottom-6 right-6 z-[100] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 max-w-sm flex items-start gap-4"
                    >
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-full mt-1">
                            <Bell size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-sm">{toast.title}</h4>
                            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default PartnerLayout
