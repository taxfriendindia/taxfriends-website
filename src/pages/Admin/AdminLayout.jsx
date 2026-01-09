import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, FileText, LogOut, Menu, Shield, ChevronLeft, ChevronRight, Activity, PieChart, Megaphone, X, IndianRupee, Clock, Zap, User, Database, MessageSquare
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const AdminLayout = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        try {
            await signOut()
            navigate('/login')
        } catch (error) {
            console.error('Logout error:', error)
            navigate('/login')
        }
    }

    if (!user) return null

    const menuItems = [
        { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/admin/clients", icon: Users, label: "Clients" },
        { to: "/admin/documents", icon: FileText, label: "Documents" },
        { to: "/admin/services", icon: Activity, label: "Services" },
        { to: "/admin/records", icon: PieChart, label: "Records" },
        { to: "/admin/announcements", icon: Megaphone, label: "Broadcast" },
        { to: "/admin/leads", icon: MessageSquare, label: "Leads" },
        { to: "/admin/data-cleaner", icon: Database, label: "Data Cleaner" },
    ]

    const finalMenuItems = menuItems

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 flex font-sans text-gray-900 dark:text-white relative">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-emerald-50/30 dark:from-transparent z-0 pointer-events-none"></div>

            {/* Sidebar (Desktop) */}
            <aside
                onMouseEnter={() => setSidebarOpen(true)}
                onMouseLeave={() => setSidebarOpen(false)}
                className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out border-r border-indigo-100/50 dark:border-gray-800 shadow-2xl ${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:block
                bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-100/50 dark:border-gray-800 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 relative">
                    <div className={`flex items-center ${!isSidebarOpen && 'justify-center w-full'}`}>
                        <div className="relative">
                            <Shield className="text-indigo-700 dark:text-indigo-400 flex-shrink-0" size={24} />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full"></div>
                        </div>
                        <span className={`font-black text-lg ml-3 whitespace-nowrap transition-opacity duration-200 text-gray-900 dark:text-white ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            Admin Panel
                        </span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2 py-6 scrollbar-thin scrollbar-thumb-indigo-200 dark:scrollbar-thumb-indigo-800 scrollbar-track-transparent hover:scrollbar-thumb-indigo-300 dark:hover:scrollbar-thumb-indigo-700 transition-all">
                        {finalMenuItems.map(item => (
                            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} isOpen={isSidebarOpen} />
                        ))}
                    </nav>

                    <div className="p-4 border-t border-indigo-100/50 dark:border-gray-800 bg-gradient-to-b from-transparent to-indigo-50/30 dark:to-indigo-950/10 space-y-3 shrink-0">
                        <NavItem to="/admin/profile" icon={User} label="My Profile" isOpen={isSidebarOpen} />
                        <button
                            onClick={handleLogout}
                            className={`flex items-center w-full p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white group border border-rose-200 dark:border-rose-800 shadow-lg shadow-rose-100 dark:shadow-none ${!isSidebarOpen && 'justify-center'}`}
                            title="Logout System"
                        >
                            <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                            <span className={`ml-4 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 w-0 -translate-x-4 hidden'}`}>
                                Sign Out
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl text-gray-900 dark:text-white z-[60] h-16 flex items-center justify-between px-4 shadow-lg border-b border-indigo-100/50 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Shield className="text-indigo-700 dark:text-indigo-400" size={20} />
                            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        </div>
                        <span className="font-black text-sm uppercase tracking-wider">Admin Hub</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right mr-2 hidden sm:block">
                        <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-tighter">Authorized</div>
                        <div className="text-xs font-bold truncate max-w-[100px]">{user.full_name?.split(' ')[0]}</div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><LogOut size={18} /></button>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 z-[80] lg:hidden flex flex-col p-6 shadow-2xl border-r border-indigo-100/50 dark:border-gray-800"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl flex items-center justify-center text-white font-black">TF</div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                    </div>
                                    <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">Admin Hub</span>
                                </div>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-gray-900 dark:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <nav className="space-y-3">
                                {finalMenuItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center p-4 rounded-2xl font-bold transition-all ${isActive
                                                ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300'
                                            }`
                                        }
                                    >
                                        <item.icon size={22} className="mr-4" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>

                            <div className="mt-auto space-y-3 pt-6 border-t border-indigo-100/50 dark:border-gray-800">
                                <NavLink
                                    to="/admin/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center p-4 rounded-2xl font-bold transition-all ${isActive
                                            ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300'
                                        }`
                                    }
                                >
                                    <User size={22} className="mr-4" /> My Profile
                                </NavLink>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center p-4 w-full text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white rounded-2xl font-bold transition-all border border-rose-200 dark:border-rose-800"
                                >
                                    <LogOut size={22} className="mr-4" /> Logout Admin
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Global Desktop Header */}
                <header className="hidden lg:flex h-16 bg-white/40 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 px-8 items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            Authorized Session
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-slate-800 tracking-tight">{user.full_name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm group"
                            title="Sign Out"
                        >
                            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 pt-8 lg:pt-8 overflow-x-hidden">
                    <Outlet context={{ isSidebarOpen, setSidebarOpen }} />
                </main>
            </div>
        </div>
    )
}

const NavItem = ({ to, icon: Icon, label, isOpen }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center p-3 rounded-xl transition-all duration-200 whitespace-nowrap font-semibold ${isActive
                ? 'bg-indigo-600 dark:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none border border-indigo-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300'
            } ${!isOpen && 'justify-center'}`
        }
        title={!isOpen ? label : ''}
    >
        <Icon size={20} className="flex-shrink-0" />
        <span className={`ml-3 transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
            {label}
        </span>
    </NavLink>
)

export default AdminLayout
