import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import { Users, Search, Filter, MoreHorizontal, Eye, Mail, Phone, CheckCircle, Clock, Trash2, Download, Edit, AlertTriangle, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ClientDetailsModal from './ClientDetailsModal'

const AdminClients = () => {
    const { setSidebarOpen } = useOutletContext() || { setSidebarOpen: () => { } }
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Filters
    const [filters, setFilters] = useState({ state: 'All', city: 'All', type: 'All' })

    // Modals
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null, inputName: '' })
    const [selectedClient, setSelectedClient] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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

    // --- DERIVED DATA FOR FILTERS ---
    const uniqueStates = useMemo(() => {
        const states = clients.map(c => c.residential_state || c.business_state).filter(Boolean)
        return ['All', ...new Set(states)].sort()
    }, [clients])

    const uniqueCities = useMemo(() => {
        // filter cities based on selected state if not 'All'
        const relevantClients = filters.state === 'All'
            ? clients
            : clients.filter(c => (c.residential_state === filters.state || c.business_state === filters.state))

        const cities = relevantClients.map(c => c.residential_city || c.business_city).filter(Boolean)
        return ['All', ...new Set(cities)].sort()
    }, [clients, filters.state])

    // --- FILTER LOGIC ---
    const filteredClients = clients.filter(client => {
        // 1. Search
        const searchMatch = (
            client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.organization?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (!searchMatch) return false

        // 2. State Filter
        if (filters.state !== 'All') {
            const clientState = client.residential_state || client.business_state
            if (clientState !== filters.state) return false
        }

        // 3. City Filter
        if (filters.city !== 'All') {
            const clientCity = client.residential_city || client.business_city
            if (clientCity !== filters.city) return false
        }

        // 4. Type Filter
        if (filters.type !== 'All') {
            const hasOrg = !!client.organization
            if (filters.type === 'Business' && !hasOrg) return false
            if (filters.type === 'Individual' && hasOrg) return false
        }

        return true
    })


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
        try {
            const userId = deleteModal.user.id
            const { error } = await supabase.from('profiles').delete().eq('id', userId)
            if (error) throw error
            setClients(clients.filter(c => c.id !== userId))
            closeDeleteModal()
            alert('User successfully deleted.')
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Failed to delete user.')
        }
    }

    const handleExport = () => {
        const fieldMapping = [
            { header: 'Full Name', key: 'full_name' },
            { header: 'Email', key: 'email' },
            { header: 'Mobile', key: 'mobile' },
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
        link.download = `taxfriends_export_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6 relative font-sans text-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Client Management</h1>
                    <p className="text-slate-500 mt-1">Manage users, view profiles, and track requests.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExport} className="flex items-center bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm font-medium">
                        <Download size={18} className="mr-2" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Controls Bar (Search + Filters) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 items-end">
                {/* Search */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Search User</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Name, org, mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* State Filter */}
                <FilterDropdown
                    label="State"
                    value={filters.state}
                    options={uniqueStates}
                    onChange={(val) => setFilters({ ...filters, state: val, city: 'All' })}
                />

                {/* City Filter */}
                <FilterDropdown
                    label="City"
                    value={filters.city}
                    options={uniqueCities}
                    onChange={(val) => setFilters({ ...filters, city: val })}
                />

                {/* Type Filter */}
                <FilterDropdown
                    label="Type"
                    value={filters.type}
                    options={['All', 'Individual', 'Business']}
                    onChange={(val) => setFilters({ ...filters, type: val })}
                />
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Business</th>
                                <th className="px-6 py-4 text-right">Actions</th>
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
                                    <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                    {client.avatar_url ? (
                                                        <img src={client.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        (client.full_name?.charAt(0) || '?').toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-semibold">{client.full_name || 'Unnamed'}</p>
                                                    <p className="text-slate-500 text-xs font-mono">{client.mobile || client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">
                                                <p>{client.residential_city || client.business_city || '-'}</p>
                                                <p className="text-xs text-slate-400">{client.residential_state || client.business_state || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900 font-medium text-sm">{client.organization || 'Individual'}</p>
                                            {client.gst_number && <p className="text-xs text-slate-500 font-mono">GST: {client.gst_number}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openDetails(client)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="View & Edit Profile">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => openDeleteModal(client)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Delete User">
                                                    <Trash2 size={18} />
                                                </button>
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
        </div>
    )
}

const FilterDropdown = ({ label, value, options, onChange }) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all hover:bg-white"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
    </div>
)

export default AdminClients
