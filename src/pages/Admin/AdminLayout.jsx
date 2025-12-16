import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Users, FileText, LogOut, Menu, Shield, ChevronLeft, ChevronRight, Activity, PieChart, Megaphone
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const AdminLayout = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [isSidebarOpen, setSidebarOpen] = useState(true)

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop')] bg-cover bg-fixed">
            {/* Overlay */}
            <div className="fixed inset-0 bg-slate-100/90 backdrop-blur-sm z-0 pointer-events-none"></div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out border-r border-white/20 shadow-2xl ${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:block
                bg-slate-900/80 backdrop-blur-md text-white`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 relative">
                    <div className={`flex items-center ${!isSidebarOpen && 'justify-center w-full'}`}>
                        <Shield className="text-indigo-400 flex-shrink-0" size={24} />
                        <span className={`font-bold text-lg ml-3 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            Admin Panel
                        </span>
                    </div>
                </div>

                {/* Floating Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-20 bg-indigo-600/90 hover:bg-indigo-600 text-white p-1.5 rounded-full shadow-lg transition-transform active:scale-95 border border-white/20 z-50 backdrop-blur-sm"
                    title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                <nav className="p-4 space-y-2 mt-4">
                    <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/clients" icon={Users} label="Clients" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/documents" icon={FileText} label="Documents" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/services" icon={Activity} label="Services" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/records" icon={PieChart} label="Records" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/announcements" icon={Megaphone} label="Broadcast" isOpen={isSidebarOpen} />

                    <div className="pt-4 border-t border-white/10 mt-4">
                        <NavItem to="/admin/profile" icon={Users} label="My Profile" isOpen={isSidebarOpen} />
                    </div>
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center text-red-300 hover:text-red-200 hover:bg-white/10 rounded-lg transition-colors w-full p-2 ${!isSidebarOpen && 'justify-center'}`}
                        title="Logout"
                    >
                        <LogOut size={20} />
                        <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-slate-900/90 backdrop-blur-md text-white z-40 h-16 flex items-center justify-between px-4 shadow-md border-b border-white/10">
                <div className="flex items-center">
                    <Shield className="text-indigo-400 mr-2" />
                    <span className="font-bold">Admin Panel</span>
                </div>
                <button onClick={handleLogout}><LogOut size={20} /></button>
            </div>

            {/* Main Content Area */}
            <main className={`flex-1 min-h-screen relative z-10 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} p-8 pt-20 lg:pt-8`}>
                <Outlet context={{ isSidebarOpen, setSidebarOpen }} />
            </main>

        </div>
    )
}

const NavItem = ({ to, icon: Icon, label, isOpen }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center p-3 rounded-xl transition-all duration-200 whitespace-nowrap ${isActive
                ? 'bg-indigo-600/80 text-white shadow-lg shadow-indigo-500/30 backdrop-blur-sm border border-white/10'
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
