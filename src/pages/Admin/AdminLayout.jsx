import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, FileText, LogOut, Menu, Shield, ChevronLeft, ChevronRight, Activity, PieChart, Megaphone, X, IndianRupee, Clock, Zap, User
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
        await signOut()
        navigate('/login')
    }

    if (!user) return null

    const menuItems = [
        { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/admin/partners", icon: Shield, label: "Partners" },
        { to: "/admin/clients", icon: Users, label: "Clients" },
        { to: "/admin/documents", icon: FileText, label: "Documents" },
        { to: "/admin/services", icon: Activity, label: "Services" },
        { to: "/admin/records", icon: PieChart, label: "Records" },
        { to: "/admin/announcements", icon: Megaphone, label: "Broadcast" },
    ]

    const isSuper = user?.role === 'superuser' || user?.email === 'taxfriend.tax@gmail.com'
    const finalMenuItems = isSuper
        ? [...menuItems, { to: "/admin/super-reset", icon: Zap, label: "System Reset" }]
        : menuItems

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop')] bg-cover bg-fixed relative">
            {/* Overlay */}
            <div className="fixed inset-0 bg-slate-100/90 backdrop-blur-sm z-0 pointer-events-none"></div>

            {/* Sidebar (Desktop) */}
            <aside
                onMouseEnter={() => setSidebarOpen(true)}
                onMouseLeave={() => setSidebarOpen(false)}
                className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out border-r border-white/20 shadow-2xl ${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:block
                bg-slate-900/80 backdrop-blur-md text-white`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 relative">
                    <div className={`flex items-center ${!isSidebarOpen && 'justify-center w-full'}`}>
                        <Shield className="text-emerald-400 flex-shrink-0" size={24} />
                        <span className={`font-bold text-lg ml-3 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            Admin Panel
                        </span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2 py-6 scrollbar-thin scrollbar-thumb-emerald-500/40 scrollbar-track-transparent hover:scrollbar-thumb-emerald-500/60 transition-all">
                        {finalMenuItems.map(item => (
                            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} isOpen={isSidebarOpen} />
                        ))}
                    </nav>

                    <div className="p-4 border-t border-white/10 bg-slate-900/60 backdrop-blur-md space-y-3 shrink-0">
                        <NavItem to="/admin/profile" icon={User} label="My Profile" isOpen={isSidebarOpen} />
                        <button
                            onClick={handleLogout}
                            className={`flex items-center w-full p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white group border border-rose-500/20 shadow-lg shadow-rose-500/5 ${!isSidebarOpen && 'justify-center'}`}
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
            <header className="lg:hidden fixed top-0 w-full bg-slate-900/90 backdrop-blur-md text-white z-[60] h-16 flex items-center justify-between px-4 shadow-md border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center">
                        <Shield className="text-emerald-400 mr-2" size={20} />
                        <span className="font-bold text-sm">ADMIN HUB</span>
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
                            className="fixed inset-y-0 left-0 w-72 bg-slate-900 z-[80] lg:hidden flex flex-col p-6 shadow-2xl border-r border-white/10"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">A</div>
                                    <span className="font-bold text-xl tracking-tight text-white">Admin Hub</span>
                                </div>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white"><X size={24} /></button>
                            </div>

                            <nav className="space-y-4">
                                {finalMenuItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center p-4 rounded-2xl font-bold transition-all ${isActive
                                                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`
                                        }
                                    >
                                        <item.icon size={22} className="mr-4" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>

                            <div className="mt-auto space-y-4 pt-6 border-t border-white/10">
                                <NavLink
                                    to="/admin/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center p-4 rounded-2xl font-bold transition-all ${isActive
                                            ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`
                                    }
                                >
                                    <User size={22} className="mr-4" /> My Profile
                                </NavLink>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center p-4 w-full text-red-400 bg-red-400/10 rounded-2xl font-bold"
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
            `flex items-center p-3 rounded-xl transition-all duration-200 whitespace-nowrap ${isActive
                ? 'bg-emerald-600/80 text-white shadow-lg shadow-emerald-500/30 backdrop-blur-sm border border-white/10'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
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
