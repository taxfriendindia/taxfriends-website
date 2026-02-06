import React, { useState, useEffect } from 'react'
import { FileText, CheckCircle, ExternalLink, Search, X, ChevronRight, Folder, FolderOpen, Mail, ShieldCheck, Briefcase, Download, Trash2, Layers, User, Phone, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { DocumentService } from '../../services/documentService'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import StatusModal from '../../components/StatusModal'
import ConfirmationModal from '../../components/ConfirmationModal'
import { useAuth } from '../../contexts/AuthContext'
import SimpleFileManager from '../../components/Documents/SimpleFileManager'

const AdminRequests = () => {
    const { user } = useAuth()
    const { setSidebarOpen } = useOutletContext() || { setSidebarOpen: () => { } }

    // --- MODE STATE: 'requests' | 'vault' ---
    const [activeMode, setActiveMode] = useState('requests')

    // --- Data States ---
    const [allDocuments, setAllDocuments] = useState([]) // For Requests
    const [recentVaultUsers, setRecentVaultUsers] = useState([]) // For Vault History
    const [loading, setLoading] = useState(true)

    // --- Search & Filter ---
    const [searchTerm, setSearchTerm] = useState('') // Shared, but behaves differently
    const [vaultSearchResults, setVaultSearchResults] = useState([]) // For Vault Global Search
    const [isSearchingVault, setIsSearchingVault] = useState(false)
    const [statusFilter, setStatusFilter] = useState('has_pending')
    const [sortBy, setSortBy] = useState('newest')

    // --- Modal State ---
    const [selectedUser, setSelectedUser] = useState(null) // Object with { id, full_name, email, ... }
    const [processingId, setProcessingId] = useState(null)
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } })

    useEffect(() => {
        fetchData()
    }, [activeMode])

    useEffect(() => {
        if (activeMode === 'vault' && searchTerm.length > 2) {
            const timer = setTimeout(searchVaultUsers, 500)
            return () => clearTimeout(timer)
        } else {
            setVaultSearchResults([])
        }
    }, [searchTerm, activeMode])

    useEffect(() => { if (selectedUser) setSidebarOpen(false) }, [selectedUser, setSidebarOpen])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeMode === 'requests') {
                await fetchRequests()
            } else {
                await fetchRecentVaults()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // --- FETCH: REQUESTS MODE ---
    const fetchRequests = async () => {
        // 1. Fetch Documents
        const { data: docs, error } = await supabase
            .from('client_supporting_docs')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        // 2. Fetch User Profiles
        const userIds = [...new Set(docs.map(d => d.user_id))]
        if (userIds.length === 0) {
            setAllDocuments([])
            return
        }

        const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, email, mobile_number, organization')
            .in('id', userIds)

        const userMap = (users || []).reduce((acc, u) => ({ ...acc, [u.id]: u }), {})

        // 3. Attach User Data
        const enrichedDocs = docs.map(d => ({
            ...d,
            user: userMap[d.user_id] || { full_name: 'Unknown User', email: 'N/A' }
        }))

        setAllDocuments(enrichedDocs)
    }

    // --- FETCH: VAULT MODE ---
    const fetchRecentVaults = async () => {
        // Find users who have folders
        const { data: folders, error } = await supabase
            .from('user_folders')
            .select('user_id, created_at')
            .order('created_at', { ascending: false })
            .limit(50) // Last 50 active users

        if (error) throw error

        const userIds = [...new Set(folders.map(f => f.user_id))]

        if (userIds.length === 0) {
            setRecentVaultUsers([])
            return
        }

        const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, email, organization, mobile_number')
            .in('id', userIds)

        setRecentVaultUsers(users || [])
    }

    const searchVaultUsers = async () => {
        setIsSearchingVault(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,organization.ilike.%${searchTerm}%,mobile_number.ilike.%${searchTerm}%`)
                .limit(10)

            if (error) throw error
            setVaultSearchResults(data || [])
        } catch (e) {
            console.error('Search failed', e)
        } finally {
            setIsSearchingVault(false)
        }
    }

    // --- HELPERS ---
    const handleStatusUpdate = async (id, newStatus) => {
        setProcessingId(id)
        try {
            const { error } = await supabase
                .from('client_supporting_docs')
                .update({ status: newStatus })
                .eq('id', id)
            if (error) throw error
            setAllDocuments(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
            if (newStatus === 'rejected') setStatusModal({ isOpen: true, type: 'success', title: 'Updated', message: 'Rejected.' })
        } catch (e) {
            setStatusModal({ isOpen: true, type: 'error', title: 'Error', message: 'Update failed.' })
        } finally {
            setProcessingId(null)
        }
    }

    const handleVerifyAll = async (userId) => {
        setProcessingId('verify-all')
        try {
            const userDocs = allDocuments.filter(d => d.user_id === userId && d.status !== 'verified')
            const docIds = userDocs.map(d => d.id)
            if (docIds.length === 0) return

            const { error } = await supabase.from('client_supporting_docs').update({ status: 'verified' }).in('id', docIds)
            if (error) throw error
            setAllDocuments(prev => prev.map(d => docIds.includes(d.id) ? { ...d, status: 'verified' } : d))
            setStatusModal({ isOpen: true, type: 'success', title: 'Success', message: 'All verified.' })
        } catch (e) {
            setStatusModal({ isOpen: true, type: 'error', title: 'Error', message: 'Batch verify failed.' })
        } finally {
            setProcessingId(null)
        }
    }

    // --- Grouping for Requests Mode ---
    const groupedUsers = React.useMemo(() => {
        if (activeMode !== 'requests') return []
        const groups = {}
        allDocuments.forEach(doc => {
            if (!groups[doc.user_id]) {
                groups[doc.user_id] = {
                    userId: doc.user_id,
                    user: doc.user,
                    documents: [],
                    stats: { total: 0, pending: 0, verified: 0, rejected: 0 }
                }
            }
            groups[doc.user_id].documents.push(doc)
            groups[doc.user_id].stats.total += 1
            groups[doc.user_id].stats[doc.status || 'pending'] += 1
        })
        let result = Object.values(groups)

        // Local filtering for requests
        if (statusFilter === 'has_pending') result = result.filter(g => g.stats.pending > 0)
        else if (statusFilter === 'verified') result = result.filter(g => g.stats.pending === 0)

        // Local search for requests
        if (searchTerm && activeMode === 'requests') {
            const lower = searchTerm.toLowerCase()
            result = result.filter(g =>
                g.user.full_name?.toLowerCase().includes(lower) ||
                g.user.email?.toLowerCase().includes(lower)
            )
        }

        result.sort((a, b) => { // Newest doc sort
            const dateA = new Date(Math.max(...a.documents.map(d => new Date(d.created_at))))
            const dateB = new Date(Math.max(...b.documents.map(d => new Date(d.created_at))))
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB
        })
        return result
    }, [allDocuments, searchTerm, statusFilter, sortBy, activeMode])

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
            case 'rejected': return 'bg-red-50 text-red-600 border-red-200'
            default: return 'bg-amber-50 text-amber-600 border-amber-200'
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* --- TOP TOGGLE --- */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        {activeMode === 'requests' ? 'Inbound Requests' : 'Outbound Vault'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {activeMode === 'requests'
                            ? 'Review and verify documents submitted by clients.'
                            : 'Manage files and folders you share with clients.'}
                    </p>
                </div>

                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 items-center shrink-0">
                    <button
                        onClick={() => { setActiveMode('requests'); setSearchTerm(''); }}
                        className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all ${activeMode === 'requests' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Client Requests
                    </button>
                    <button
                        onClick={() => { setActiveMode('vault'); setSearchTerm(''); }}
                        className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all ${activeMode === 'vault' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        My Vault
                    </button>
                </div>
            </div>

            {/* --- CONTROLS --- */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-20">
                {/* Search Container */}
                <div className="relative w-full md:w-96 group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchingVault ? 'text-emerald-500 animate-pulse' : 'text-slate-400 group-focus-within:text-indigo-500'}`} size={18} />
                    <input
                        type="text"
                        placeholder={activeMode === 'requests' ? "Filter list by name..." : "Search ANY client to open Vault..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 outline-none transition-all ${activeMode === 'vault' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                    />
                    {/* VAULT SEARCH DROPDOWN */}
                    {activeMode === 'vault' && searchTerm.length > 0 && <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto z-50">
                        {vaultSearchResults.length > 0 ? (
                            vaultSearchResults.map(user => (
                                <div key={user.id} onClick={() => { setSelectedUser(user); setSearchTerm(''); }} className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">{(user.full_name?.[0] || 'U').toUpperCase()}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-800 text-sm truncate">{user.full_name}</div>
                                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                    </div>
                                    <ArrowRight size={14} className="text-emerald-300" />
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                                {isSearchingVault ? 'Searching...' : 'No users found.'}
                            </div>
                        )}
                    </div>}
                </div>

                {activeMode === 'requests' && (
                    <div className="flex w-full md:w-auto gap-3 overflow-x-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="has_pending">Pending Only</option>
                            <option value="verified">Verified Only</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                        </select>
                    </div>
                )}
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">Loading data...</div>
                ) : activeMode === 'requests' ? (
                    /* === REQUESTS VIEW === */
                    groupedUsers.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center opacity-50">
                            <Folder className="w-16 h-16 text-slate-300 mb-4" />
                            <p className="font-medium">No pending requests found.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden md:block">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {groupedUsers.map(group => (
                                        <tr key={group.userId} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                                        {(group.user.full_name?.[0] || 'C').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">{group.user.full_name}</div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Mail size={10} /> {group.user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    {group.stats.pending > 0 ? (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded-lg border border-amber-200/50 animate-pulse-slow">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            {group.stats.pending} Pending
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-lg border border-emerald-200/50">
                                                            <CheckCircle size={10} /> Verified
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button onClick={() => setSelectedUser({ ...group.user, documents: group.documents, type: 'request_view' })} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all">
                                                    View Docs <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Mobile Requests View */}
                            <div className="md:hidden space-y-3 p-4">
                                {groupedUsers.map(group => (
                                    <div key={group.userId} onClick={() => setSelectedUser({ ...group.user, documents: group.documents, type: 'request_view' })} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                {(group.user.full_name?.[0] || 'C').toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{group.user.full_name}</div>
                                                {group.stats.pending > 0 && <span className="text-[10px] text-amber-600 font-bold">{group.stats.pending} Pending</span>}
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    /* === VAULT VIEW (Recent History) === */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="col-span-full mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Layers size={18} className="text-emerald-500" /> Recently Active Vaults
                            </h3>
                        </div>
                        {recentVaultUsers.map(user => (
                            <div key={user.id} onClick={() => setSelectedUser(user)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 cursor-pointer transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                                        {(user.full_name?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <FolderOpen size={14} />
                                    </div>
                                </div>
                                <h4 className="font-bold text-slate-800 truncate">{user.full_name}</h4>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                    <Mail size={12} /> {user.email}
                                </div>
                                {user.organization && (
                                    <div className="mt-3 inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wide">
                                        {user.organization}
                                    </div>
                                )}
                            </div>
                        ))}
                        {recentVaultUsers.length === 0 && (
                            <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                <p className="text-slate-400 font-medium">No recent vault activity.</p>
                                <p className="text-slate-300 text-sm mt-1">Search for a client above to start uploading.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className={`p-4 md:p-6 border-b border-slate-100 flex justify-between items-start ${activeMode === 'vault' || selectedUser.type !== 'request_view' ? 'bg-emerald-50/50' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-white/50 ${activeMode === 'vault' || selectedUser.type !== 'request_view' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-indigo-600'}`}>
                                        {activeMode === 'vault' || selectedUser.type !== 'request_view' ? <Layers size={24} /> : <Download size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold text-slate-900">{selectedUser.full_name}</h2>
                                            {activeMode === 'vault' ?
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-full tracking-wide">Vault Access</span> :
                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase rounded-full tracking-wide">Client Uploads</span>
                                            }
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-hidden flex flex-col bg-white relative">
                                {activeMode === 'vault' || selectedUser.type !== 'request_view' ? (
                                    /* === VAULT MODAL CONTENT === */
                                    <div className="flex-1 p-0 overflow-y-auto">
                                        <SimpleFileManager userId={selectedUser.id} />
                                    </div>
                                ) : (
                                    /* === REQUESTS MODAL CONTENT === */
                                    <div className="flex-1 flex flex-col h-full">
                                        {/* Toolbar */}
                                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                {selectedUser.documents?.length || 0} Files
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => DocumentService.downloadAsZip(selectedUser.documents, `${selectedUser.full_name}_docs`)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    <Download size={14} /> ZIP ALL
                                                </button>
                                                {selectedUser.documents?.some(d => d.status !== 'verified') && (
                                                    <button
                                                        onClick={() => handleVerifyAll(selectedUser.id)}
                                                        disabled={processingId === 'verify-all'}
                                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                                    >
                                                        <ShieldCheck size={14} /> Verify All
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Doc List */}
                                        <div className="flex-1 overflow-y-auto p-0">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                                                    <tr>
                                                        <th className="px-6 py-3">File Name</th>
                                                        <th className="px-6 py-3">Date</th>
                                                        <th className="px-6 py-3">Status</th>
                                                        <th className="px-6 py-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {selectedUser.documents?.map(doc => (
                                                        <tr key={doc.id} className="hover:bg-slate-50">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <FileText className="text-indigo-400" size={18} />
                                                                    <span className="font-medium text-slate-700 text-sm truncate max-w-[200px]" title={doc.file_name}>{doc.file_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(doc.status)}`}>
                                                                    {doc.status || 'pending'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <DocActions doc={doc} processingId={processingId} onUpdate={handleStatusUpdate} userId={selectedUser.id} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
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

const DocActions = ({ doc, processingId, onUpdate }) => {
    const isValidUrl = (string) => { try { return Boolean(new URL(string)); } catch (e) { return false; } }

    return (
        <div className="flex items-center justify-end gap-1">
            {doc.file_url && isValidUrl(doc.file_url) ? (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all">
                    <ExternalLink size={16} />
                </a>
            ) : <span className="p-1.5 text-slate-200"><ExternalLink size={16} /></span>}

            {doc.status !== 'verified' && (
                <button
                    onClick={() => onUpdate(doc.id, 'verified')}
                    disabled={processingId === doc.id}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all">
                    {processingId === doc.id ? <div className="animate-spin w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full" /> : <CheckCircle size={16} />}
                </button>
            )}

            <button
                onClick={() => { if (confirm("Delete?")) onUpdate(doc.id, 'deleted') }}
                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-all">
                <Trash2 size={16} />
            </button>
        </div>
    )
}

export default AdminRequests
