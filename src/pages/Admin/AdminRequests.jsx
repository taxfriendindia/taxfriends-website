import React, { useState, useEffect } from 'react'
import { FileText, Eye, CheckCircle, XCircle, Clock, ExternalLink, Filter, Search, X, ChevronRight, Folder, FolderOpen, Mail, Phone, MoreVertical, ShieldCheck, List, Briefcase, Smartphone, Download, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { DocumentService } from '../../services/documentService'
import { UserService } from '../../services/userService'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import StatusModal from '../../components/StatusModal'
import ConfirmationModal from '../../components/ConfirmationModal'
import { useAuth } from '../../contexts/AuthContext'

const AdminRequests = () => {
    const { user } = useAuth()
    const { setSidebarOpen } = useOutletContext() || { setSidebarOpen: () => { } }
    const [allDocuments, setAllDocuments] = useState([])
    const [loading, setLoading] = useState(true)

    // Filter States
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('has_pending') // Default to 'has_pending' to show actionable items first
    const [sortBy, setSortBy] = useState('newest') // 'newest', 'oldest'

    // Modal State
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [processingId, setProcessingId] = useState(null)
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } })

    useEffect(() => {
        setStatusFilter('all') // Reset to all on mount or keep previous preference
        fetchRequests()
    }, [])

    useEffect(() => {
        // Auto-close sidebar when modal opens to maximize space per user request
        if (selectedUserId) {
            setSidebarOpen(false)
        }
    }, [selectedUserId, setSidebarOpen])

    const fetchRequests = async () => {
        try {
            setLoading(true)

            // 1. Fetch Documents
            const { data: docs, error } = await supabase
                .from('user_documents')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.warn("Error fetching documents:", error)
                setAllDocuments([])
                return
            }

            if (docs && docs.length > 0) {
                const userIds = [...new Set(docs.map(d => d.user_id).filter(Boolean))]

                const { data: profiles, error: pError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, mobile_number, organization, role')
                    .in('id', userIds)

                if (pError) {
                    console.error("Error fetching profiles for documents:", pError)
                }

                const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id.toLowerCase()]: p }), {})

                // 3. Join documents with profile data
                const joinedDocs = docs.map(doc => {
                    const uid = doc.user_id?.toLowerCase()
                    const userProfile = profileMap[uid]

                    return {
                        ...doc,
                        profiles: userProfile || { id: doc.user_id, full_name: null, email: 'ID: ' + doc.user_id?.slice(0, 8) }
                    }
                })

                setAllDocuments(joinedDocs)
            } else {
                setAllDocuments([])
            }

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setProcessingId(id)
            const { error } = await supabase
                .from('user_documents')
                .update({
                    status: newStatus,
                    handled_by: user?.id
                })
                .eq('id', id)

            if (error) throw error

            setAllDocuments(prev => prev.map(doc =>
                doc.id === id ? { ...doc, status: newStatus } : doc
            ))
        } catch (error) {
            console.error('Error updating status:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Operation Failed',
                message: 'Failed to update document status.'
            })
        } finally {
            setProcessingId(null)
        }
    }

    const handleVerifyAll = async (userId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Verify All Documents',
            message: 'Are you sure you want to verify ALL pending documents for this user?',
            onConfirm: () => executeVerifyAll(userId)
        })
    }

    const executeVerifyAll = async (userId) => {

        const userDocs = allDocuments.filter(d => d.user_id === userId && d.status !== 'verified')
        if (userDocs.length === 0) return

        try {
            setProcessingId('verify-all')
            const docIds = userDocs.map(d => d.id)

            const { error } = await supabase
                .from('user_documents')
                .update({
                    status: 'verified',
                    handled_by: user?.id
                })
                .in('id', docIds)

            if (error) throw error

            setAllDocuments(prev => prev.map(doc =>
                docIds.includes(doc.id) ? { ...doc, status: 'verified' } : doc
            ))

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Batch Action Success',
                message: `Successfully verified ${docIds.length} documents.`
            })
        } catch (error) {
            console.error('Error verifying all:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Batch Action Failed',
                message: 'Failed to verify all documents.'
            })
        } finally {
            setProcessingId(null)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-amber-100 text-amber-700 border-amber-200'
        }
    }

    const isValidUrl = (string) => {
        try {
            return Boolean(new URL(string));
        }
        catch (e) {
            return false;
        }
    }

    // Group Documents by User
    const groupedUsers = React.useMemo(() => {
        const groups = {}

        allDocuments.forEach(doc => {
            if (!groups[doc.user_id]) {
                groups[doc.user_id] = {
                    user: doc.profiles,
                    userId: doc.user_id,
                    documents: [],
                    stats: { pending: 0, verified: 0, rejected: 0, total: 0 },
                    latestUpload: null
                }
            }
            groups[doc.user_id].documents.push(doc)
            groups[doc.user_id].stats.total++
            groups[doc.user_id].stats[doc.status || 'pending'] = (groups[doc.user_id].stats[doc.status || 'pending'] || 0) + 1

            // Track latest upload
            const docDate = new Date(doc.created_at)
            if (!groups[doc.user_id].latestUpload || docDate > groups[doc.user_id].latestUpload) {
                groups[doc.user_id].latestUpload = docDate
            }
        })

        return Object.values(groups)
            .filter(group => {
                // 1. Text Search
                const term = searchTerm.toLowerCase()
                const matchesSearch = !searchTerm || (
                    group.user.full_name?.toLowerCase().includes(term) ||
                    group.user.email?.toLowerCase().includes(term) ||
                    group.user.organization?.toLowerCase().includes(term)
                )
                if (!matchesSearch) return false

                // 2. Status Filter
                if (statusFilter === 'all') return true
                if (statusFilter === 'has_pending') return group.stats.pending > 0
                if (statusFilter === 'has_rejected') return group.stats.rejected > 0
                if (statusFilter === 'all_verified') return (group.stats.pending === 0 && group.stats.rejected === 0 && group.stats.verified > 0)

                return true
            })
            .sort((a, b) => {
                // Sort by latest upload
                const timeA = a.latestUpload ? a.latestUpload.getTime() : 0
                const timeB = b.latestUpload ? b.latestUpload.getTime() : 0
                return sortBy === 'newest' ? timeB - timeA : timeA - timeB
            })
    }, [allDocuments, searchTerm, statusFilter, sortBy])

    const selectedGroup = selectedUserId ? groupedUsers.find(g => g.userId === selectedUserId) : null

    return (
        <div className="space-y-8 font-sans text-slate-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Client Documents</h1>
                    <p className="text-slate-500 mt-1">Review documents grouped by client.</p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 md:flex md:items-center md:gap-4 space-y-4 md:space-y-0">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by client, company, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-slate-400 pl-1 mb-0.5">Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer min-w-[160px]"
                        >
                            <option value="all">Show All</option>
                            <option value="has_pending">Has Pending Action</option>
                            <option value="has_rejected">Has Rejected Docs</option>
                            <option value="all_verified">All Verified</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-slate-400 pl-1 mb-0.5">Sort</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List View of Clients */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                        <p>Loading clients...</p>
                    </div>
                ) : groupedUsers.length === 0 ? (
                    <div className="p-20 text-center text-slate-500">
                        <FolderOpen size={48} className="mx-auto mb-4 text-slate-300" />
                        <p>No client documents found matching your search.</p>
                        {(statusFilter !== 'all' || searchTerm) && (
                            <button
                                onClick={() => { setStatusFilter('all'); setSearchTerm('') }}
                                className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Table View (Desktop) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Affiliation</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Node</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {groupedUsers.map(group => (
                                        <tr
                                            key={group.userId}
                                            className="hover:bg-indigo-50/20 transition-all cursor-pointer group"
                                            onClick={() => setSelectedUserId(group.userId)}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 text-emerald-600 flex items-center justify-center font-black shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                        {(group.user.full_name?.[0] || group.user.email?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-[14px] tracking-tight leading-tight group-hover:text-emerald-600 transition-colors">
                                                            {group.user.full_name || (group.user.email?.includes('@') ? group.user.email.split('@')[0] : group.user.email) || 'Unnamed Client'}
                                                        </p>
                                                        <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                                                            <Mail size={10} /> {group.user.email || 'No Email Sync'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {group.user.organization ? (
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center font-black text-slate-700 text-[10px] uppercase tracking-wider">
                                                            {group.user.organization}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Registered Entity</div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Individual</span>
                                                        <span className="text-[9px] text-slate-300 italic">No Organization</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                {group.user.mobile_number ? (
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center text-slate-600 text-[11px] font-black font-mono">
                                                            {group.user.mobile_number}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Direct Line</div>
                                                    </div>
                                                ) : <span className="text-slate-300 text-[10px] italic">Not Provided</span>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    {group.stats.pending > 0 ? (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded-lg border border-amber-200/50 shadow-sm animate-pulse-slow">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            {group.stats.pending} Pending
                                                        </div>
                                                    ) : group.stats.verified > 0 ? (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-lg border border-emerald-200/50">
                                                            <CheckCircle size={10} className="text-emerald-500" />
                                                            Fully Verified
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-300 uppercase bg-slate-50 px-2 py-1 rounded">No Records</span>
                                                    )}
                                                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 shadow-inner">
                                                        {group.stats.total}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:shadow-emerald-600/20 transition-all active:scale-95 group/btn">
                                                    <span>View Docs</span>
                                                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Card View (Mobile) */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {groupedUsers.map(group => (
                                <div
                                    key={group.userId}
                                    className="p-4 space-y-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedUserId(group.userId)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                                                {(group.user.full_name?.[0] || 'C').toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-900 leading-tight truncate">
                                                    {group.user.full_name || 'New Client'}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium truncate">
                                                    {group.user.email}
                                                </div>
                                            </div>
                                        </div>
                                        {group.stats.pending > 0 ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 text-[8px] font-black uppercase rounded-lg border border-amber-200/50 shrink-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                {group.stats.pending}
                                            </div>
                                        ) : (
                                            <div className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-lg border border-emerald-200/50 shrink-0">
                                                Verified
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documents</span>
                                                <span className="text-xs font-black text-slate-700">{group.stats.total} Total</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Organization</span>
                                                <span className="block text-[10px] font-bold text-slate-600 truncate max-w-[120px]">
                                                    {group.user.organization || 'Individual'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* User Documents Modal */}
            <AnimatePresence>
                {selectedGroup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                                <div className="flex items-center gap-3 md:gap-5">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white text-indigo-600 rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
                                        <FolderOpen size={window.innerWidth < 768 ? 24 : 32} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h2 className="text-lg md:text-2xl font-bold text-slate-900 truncate">
                                            {selectedGroup.user.full_name || selectedGroup.user.email?.split('@')[0] || 'Client Profile'}
                                        </h2>
                                        <div className="flex flex-wrap items-center text-[10px] md:text-sm text-slate-500 gap-2 md:gap-4 mt-1">
                                            {selectedGroup.user.organization && (
                                                <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-200/50 px-1.5 py-0.5 rounded">
                                                    <Briefcase size={12} /> {selectedGroup.user.organization}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1"><Mail size={12} /> {selectedGroup.user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUserId(null)} className="p-2 hover:bg-slate-200/80 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white sticky top-0 z-20 gap-3">
                                <div className="text-[10px] md:text-sm font-medium text-slate-500 uppercase tracking-widest">
                                    <strong>{selectedGroup.documents.length}</strong> DOCUMENTS DOWNLOADABLE
                                </div>
                                <div className="flex w-full md:w-auto gap-2">
                                    <button
                                        onClick={() => DocumentService.downloadAsZip(selectedGroup.documents, `${selectedGroup.user.full_name}_docs`)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs md:text-sm font-bold transition-all"
                                    >
                                        <Download size={16} />
                                        ZIP
                                    </button>

                                    {selectedGroup.stats.pending > 0 && (
                                        <button
                                            onClick={() => handleVerifyAll(selectedGroup.userId)}
                                            disabled={processingId === 'verify-all'}
                                            className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                                        >
                                            <ShieldCheck size={16} />
                                            {processingId === 'verify-all' ? '...' : 'Verify All'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Documents List */}
                            <div className="overflow-y-auto flex-1 p-0 bg-slate-50/50">
                                <div className="hidden md:block">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3">Document</th>
                                                <th className="px-6 py-3">Uploaded</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {selectedGroup.documents.map(doc => (
                                                <tr key={doc.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-slate-800 font-medium">
                                                            <FileText size={20} className="mr-3 text-indigo-400" />
                                                            <span className="truncate max-w-[200px]" title={doc.name}>{doc.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                                        {new Date(doc.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(doc.status)}`}>
                                                            {doc.status || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-1">
                                                        <DocActions doc={doc} processingId={processingId} onUpdate={handleStatusUpdate} onRefresh={fetchRequests} userId={selectedGroup.userId} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards for Documents */}
                                <div className="md:hidden divide-y divide-slate-100 bg-white">
                                    {selectedGroup.documents.map(doc => (
                                        <div key={doc.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 max-w-[70%]">
                                                    <FileText size={18} className="text-indigo-500 shrink-0" />
                                                    <span className="text-xs font-bold text-slate-800 truncate">{doc.name}</span>
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getStatusColor(doc.status)} uppercase`}>
                                                    {doc.status || 'pending'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                <div className="flex gap-2">
                                                    <DocActions doc={doc} processingId={processingId} onUpdate={handleStatusUpdate} onRefresh={fetchRequests} userId={selectedGroup.userId} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                danger={true}
                confirmLabel="Yes, Process"
            />
        </div >
    )
}

export default AdminRequests

const DocActions = ({ doc, processingId, onUpdate, onRefresh, userId }) => {
    const isValidUrl = (string) => {
        try { return Boolean(new URL(string)); } catch (e) { return false; }
    }

    return (
        <div className="flex items-center justify-end gap-1">
            {doc.file_url && isValidUrl(doc.file_url) ? (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="View">
                    <ExternalLink size={18} />
                </a>
            ) : (
                <span className="p-2 text-slate-200 cursor-not-allowed"><ExternalLink size={18} /></span>
            )}

            {doc.status !== 'verified' && (
                <button
                    onClick={() => onUpdate(doc.id, 'verified')}
                    disabled={processingId === doc.id}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                >
                    {processingId === doc.id ? <div className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" /> : <CheckCircle size={18} />}
                </button>
            )}

            <button
                onClick={async () => {
                    if (!confirm("Delete this document?")) return;
                    try {
                        await DocumentService.deleteDocument(doc.id, doc.file_url);
                        onRefresh();
                    } catch (e) { console.error(e) }
                }}
                disabled={processingId === doc.id}
                className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
            >
                <Trash2 size={18} />
            </button>
        </div>
    )
}
