import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { Users, Search, Filter, MoreHorizontal, Eye, Mail, Phone, CheckCircle, Clock, Trash2, Download, Edit, AlertTriangle, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import ClientDetailsModal from './ClientDetailsModal'
import StatusModal from '../../components/StatusModal'

const AdminClients = () => {
    const { user } = useAuth()
    const { setSidebarOpen } = useOutletContext() || { setSidebarOpen: () => { } }
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Filters (Removed regional filters as they are now in Partners section)
    const [filters, setFilters] = useState({ type: 'All' })

    // Modals
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null, inputName: '' })
    const [selectedClient, setSelectedClient] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })

    useEffect(() => {
        fetchClients()
    }, [])

    // Auto-collapse sidebar when modal opens
    useEffect(() => {
        if (isDetailsOpen) {
            setSidebarOpen(false)
        }
    }, [isDetailsOpen, setSidebarOpen])

    const fetchClients = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setClients(data || [])
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setLoading(false)
        }
    }

    // View Mode
    const [searchParams] = useSearchParams()
    const [viewMode, setViewMode] = useState(searchParams.get('view') || 'clients') // 'clients' | 'admins'

    useEffect(() => {
        const view = searchParams.get('view')
        if (view) setViewMode(view)
    }, [searchParams])

    // --- ACTIONS ---
    const handleClientUpdate = (updatedData) => {
        setClients(clients.map(c => c.id === updatedData.id ? { ...c, ...updatedData } : c))
        // also update selected client to reflect changes immediately in modal if open
        setSelectedClient({ ...selectedClient, ...updatedData })
    }

    const openDetails = (client) => {
        setSelectedClient(client)
        setIsDetailsOpen(true)
    }

    // ... (Delete logic remains same) ...
    const openDeleteModal = (user) => {
        setDeleteModal({ isOpen: true, user, inputName: '' })
    }
    const closeDeleteModal = () => setDeleteModal({ isOpen: false, user: null, inputName: '' })
    const confirmDelete = async () => {
        if (deleteModal.inputName !== 'DELETE') return

        // Safety Check: Prevent deleting Super Users
        if (deleteModal.user?.role === 'superuser') {
            setStatusModal({ isOpen: true, type: 'error', title: 'Action Denied', message: 'Super Users cannot be removed.' })
            closeDeleteModal()
            return
        }

        try {
            const userId = deleteModal.user.id
            const { error } = await supabase.from('profiles').delete().eq('id', userId)
            if (error) throw error
            setClients(clients.filter(c => c.id !== userId))
            closeDeleteModal()
            setStatusModal({ isOpen: true, type: 'success', title: 'Deleted', message: 'User record has been permanently removed.' })
        } catch (error) {
            console.error('Error deleting user:', error)
            setStatusModal({ isOpen: true, type: 'error', title: 'Process Failed', message: 'Failed to delete user.' })
        }
    }

    // --- STATS ---
    const stats = useMemo(() => {
        return {
            clients: clients.filter(c => !['admin', 'superuser'].includes(c.role)).length,
            admins: clients.filter(c => ['admin', 'superuser'].includes(c.role)).length
        }
    }, [clients])

    // Region filters removed from Clients - handled in Partners section

    // --- FILTER LOGIC ---
    const filteredClients = clients.filter(client => {
        // 0. View Mode (Role Filter - Inclusive)
        if (viewMode === 'clients') {
            // Clients view includes 'client', 'user', or empty role
            if (['admin', 'superuser'].includes(client.role)) return false
        }
        if (viewMode === 'admins' && !['admin', 'superuser'].includes(client.role)) return false

        // 1. Search
        const searchMatch = (
            client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.mobile_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.organization?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (!searchMatch) return false

        // Regional filters removed

        // 4. Type Filter
        if (filters.type !== 'All') {
            const hasOrg = !!client.organization
            if (filters.type === 'Business' && !hasOrg) return false
            if (filters.type === 'Individual' && hasOrg) return false
        }

        return true
    })

    const handleExport = () => {
        const fieldMapping = [
            { header: 'Full Name', key: 'full_name' },
            { header: 'Email', key: 'email' },
            { header: 'Mobile', key: 'mobile_number' },
            { header: 'Mother\'s Name', key: 'mothers_name' },
            { header: 'Date of Birth', key: 'dob' },
            { header: 'Organization', key: 'organization' },
            { header: 'GST Number', key: 'gst_number' },
            { header: 'Residential Address', key: 'residential_address' },
            { header: 'Res. City', key: 'residential_city' },
            { header: 'Res. State', key: 'residential_state' },
            { header: 'Res. Pincode', key: 'residential_pincode' },
            { header: 'Business Address', key: 'business_address' },
            { header: 'Bus. City', key: 'business_city' },
            { header: 'Bus. State', key: 'business_state' },
            { header: 'Bus. Pincode', key: 'business_pincode' },
            { header: 'Registration Date', key: 'created_at' }
        ]
        const csvContent = [
            fieldMapping.map(f => f.header).join(','),
            ...clients.map(c => fieldMapping.map(f => `"${String(c[f.key] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `apnataxfriend_export_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6 relative font-sans text-slate-900 pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">User Directory</h1>
                    <p className="text-slate-500 font-medium">Manage permissions, profiles, and platform access.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-slate-200 p-3 rounded-[1.25rem] shadow-sm items-center gap-4">
                        <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
                            <div className="text-xl font-black text-emerald-600 leading-none">{stats.clients}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clients</div>
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                            <div className="text-xl font-black text-slate-800 leading-none">{stats.admins}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Admins</div>
                        </div>
                    </div>

                    <button onClick={handleExport} className="flex items-center bg-emerald-600 text-white px-5 py-3 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 font-bold text-xs uppercase tracking-widest">
                        <Download size={16} className="mr-2" /> Export
                    </button>
                </div>
            </div>

            {/* Premium Filter Controls */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-4">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner min-w-max">
                        {['clients', 'admins'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`py-2 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode
                                    ? 'bg-white text-emerald-600 shadow-sm scale-105'
                                    : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2 hidden lg:block" />

                    {/* Search Field */}
                    <div className="flex-1 min-w-[280px] relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find by name, organization or contact..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                    <FilterDropdown
                        label="Entity Type"
                        value={filters.type}
                        options={['All', 'Individual', 'Business']}
                        onChange={(val) => setFilters({ ...filters, type: val })}
                    />
                </div>
            </div>

            {/* High Density Data Table */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Regional Node</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Model</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400">Loading...</td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 italic">No clients found.</td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                                    {client.avatar_url ? (
                                                        <img src={client.avatar_url} alt="" crossOrigin="anonymous" className="w-full h-full rounded-2xl object-cover" />
                                                    ) : (
                                                        <span className="font-black text-lg">{(client.full_name?.charAt(0) || client.email?.charAt(0) || '?').toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black text-sm tracking-tight leading-tight">
                                                        {client.full_name || (client.email?.includes('@') ? client.email.split('@')[0] : client.email) || 'Unnamed Client'}
                                                    </p>
                                                    <p className="text-slate-400 text-xs font-medium mt-0.5">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-600">
                                                <p className="flex items-center gap-1.5"><Filter size={12} className="text-slate-300" /> {client.residential_city || client.business_city || '--'}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 ml-4.5">{client.residential_state || client.business_state || 'Global'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-100 w-max">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-slate-900 font-black text-[10px] uppercase tracking-widest">{client.organization || 'Individual Entity'}</p>
                                            {client.gst_number && <p className="text-[10px] text-slate-400 font-mono mt-1">GST: {client.gst_number}</p>}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => openDetails(client)} className="p-2.5 text-emerald-600 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl transition-all shadow-sm" title="Manage Profile">
                                                    <Eye size={18} />
                                                </button>
                                                {user?.role === 'superuser' && client.role !== 'superuser' && client.email !== 'taxfriend.tax@gmail.com' && (
                                                    <button onClick={() => openDeleteModal(client)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Terminate Account">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
                    <span>Showing {filteredClients.length} of {clients.length} clients</span>
                </div>
            </div>

            {/* Client Details Modal */}
            <ClientDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                client={selectedClient}
                onUpdate={handleClientUpdate}
                currentUser={user}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Delete User?</h3>
                            <p className="text-center text-slate-500 text-sm mb-6">
                                This action cannot be undone. Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm.
                            </p>
                            <input
                                type="text"
                                value={deleteModal.inputName}
                                onChange={(e) => setDeleteModal({ ...deleteModal, inputName: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none mb-6 text-center font-medium placeholder:text-slate-300"
                                placeholder="Type DELETE"
                            />
                            <div className="flex space-x-3">
                                <button onClick={closeDeleteModal} className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
                                <button onClick={confirmDelete} disabled={deleteModal.inputName !== 'DELETE'} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    )
}

const FilterDropdown = ({ label, value, options, onChange }) => (
    <div className="flex flex-col flex-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none cursor-pointer transition-all hover:bg-white shadow-sm"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
    </div>
)

export default AdminClients
