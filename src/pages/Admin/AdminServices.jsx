import React, { useState, useEffect } from 'react'
import { Activity, ExternalLink, Filter, CheckCircle, XCircle, Clock, PlayCircle, ArrowDownUp, Search, Trash2, Users, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { UserService } from '../../services/userService'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import StatusModal from '../../components/StatusModal'

const AdminServices = () => {
    const { user } = useAuth()
    const location = useLocation()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, serviceId: null, userId: null, title: '' })
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' })

    // Filters State
    const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || 'all')
    const [serviceTypeFilter, setServiceTypeFilter] = useState('all')
    const [adminFilter, setAdminFilter] = useState('all') // New Admin Filter
    const [sortBy, setSortBy] = useState('newest')
    const [searchQuery, setSearchQuery] = useState('')

    // Derived lists
    const [availableServiceTypes, setAvailableServiceTypes] = useState([])
    const [admins, setAdmins] = useState([]) // List of admins

    useEffect(() => {
        fetchServicesAndAdmins()
    }, [])

    const fetchServicesAndAdmins = async () => {
        try {
            setLoading(true)

            // 1. Fetch raw services, profiles, and catalog in parallel for speed and reliability
            const [servsRes, profsRes, catRes] = await Promise.all([
                supabase.from('user_services').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, full_name, email, mobile_number, role'),
                supabase.from('service_catalog').select('id, title')
            ])

            if (servsRes.error) throw servsRes.error

            const profileMap = (profsRes.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
            const catalogMap = (catRes.data || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {})

            // 2. Set Admins for filters
            setAdmins((profsRes.data || []).filter(p => ['admin', 'superuser'].includes(p.role)))

            const joinedServices = (servsRes.data || []).map(s => {
                const p = profileMap[s.user_id]
                const cat = catalogMap[s.service_id]

                // Identity Logic
                const email = p?.email || 'No Email'
                const fallbackName = email.includes('@') ? email.split('@')[0] : 'New Client'
                const displayName = p?.full_name || fallbackName

                return {
                    ...s,
                    profile: {
                        full_name: displayName,
                        email: email,
                        role: p?.role || 'client',
                        mobile: p?.mobile_number
                    },
                    title: cat?.title || s.service_type || 'Service'
                }
            })

            setServices(joinedServices)

            // Extract unique service types
            const types = [...new Set(joinedServices.map(s => s.title))]
            setAvailableServiceTypes(types.sort())

        } catch (err) {
            console.error(err)
            setServices([])
        } finally {
            setLoading(false)
        }
    }

    const filteredServices = services
        .filter(s => {
            // 1. Status Filter
            if (statusFilter !== 'all' && (s.status || 'pending') !== statusFilter) return false

            // 2. Service Type Filter
            if (serviceTypeFilter !== 'all' && s.title !== serviceTypeFilter) return false

            // 3. Admin Filter 
            if (adminFilter !== 'all') {
                return s.handled_by === adminFilter
            }

            // 4. Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                return (
                    s.profile.full_name?.toLowerCase().includes(q) ||
                    s.profile.email?.toLowerCase().includes(q) ||
                    s.title?.toLowerCase().includes(q)
                )
            }

            return true
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at)
            const dateB = new Date(b.created_at)
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB
        })

    // Calculate Stats based on FILTERED services to show performace of selection
    const stats = filteredServices.reduce((acc, s) => {
        acc.total++
        if (s.status === 'completed' || s.status === 'approved') acc.approved++
        else if (s.status === 'rejected') acc.rejected++
        else acc.pending++
        return acc
    }, { total: 0, approved: 0, rejected: 0, pending: 0 })

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // We update the status
            // Note: 'admin_id' column is currently missing in DB. Uncomment after running supabase/05_admin_tracking.sql
            const { error } = await supabase
                .from('user_services')
                .update({
                    status: newStatus,
                    handled_by: user.id
                })
                .eq('id', id)

            if (error) throw error

            setServices(services.map(s =>
                s.id === id ? { ...s, status: newStatus } : s
            ))
        } catch (error) {
            console.error('Error updating status:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Update Failed',
                message: 'Could not update service status.'
            })
        }
    }

    const deleteAllRejected = async () => {
        if (!window.confirm('Are you sure you want to delete ALL rejected requests? This cannot be undone.')) return
        try {
            const { error } = await supabase.from('user_services').delete().eq('status', 'rejected')
            if (error) throw error
            setServices(prev => prev.filter(s => s.status !== 'rejected'))
        } catch (error) {
            console.error('Error deleting rejected:', error)
            alert('Failed to delete requests')
        }
    }

    const deleteServiceRequest = async (id) => {
        if (!window.confirm('Delete this service request?')) return
        try {
            const { error } = await supabase.from('user_services').delete().eq('id', id)
            if (error) throw error
            setServices(prev => prev.filter(s => s.id !== id))
        } catch (error) {
            console.error('Error deleting:', error)
            alert('Failed to delete')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-amber-100 text-amber-700 border-amber-200'
        }
    }

    return (
        <div className="space-y-6 font-sans text-slate-900">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Service Requests</h1>
                    <p className="text-slate-500 mt-1">Manage, filter, and track service performance.</p>
                </div>
                {services.some(s => s.status === 'rejected') && user?.role === 'superuser' && (
                    <button
                        onClick={deleteAllRejected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold text-xs border border-red-100"
                    >
                        <Trash2 size={14} />
                        Clear Rejected
                    </button>
                )}
            </div>

            {/* Performance Stats Cards (Vibrant Gradient Theme) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Total" count={stats.total} icon={Activity} color="indigo" />
                <StatBox label="Approved" count={stats.approved} icon={CheckCircle} color="emerald" />
                <StatBox label="Rejected" count={stats.rejected} icon={XCircle} color="rose" />
                <StatBox label="Pending" count={stats.pending} icon={Clock} color="amber" />
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search clients or services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap items-center gap-3">

                    {/* Admin Filter - Replaces Manage Admins Page */}
                    {(user?.role === 'superuser' || admins.length > 0) && (
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 pl-1 mb-0.5">Filter by Admin</label>
                            <select
                                value={adminFilter}
                                onChange={(e) => setAdminFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer min-w-[160px]"
                            >
                                <option value="all">All Admins</option>
                                {admins.map(adm => (
                                    <option key={adm.id} value={adm.id}>{adm.full_name || adm.email}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-slate-400 pl-1 mb-0.5">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer min-w-[140px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Service Type Filter */}
                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-slate-400 pl-1 mb-0.5">Service Type</label>
                        <select
                            value={serviceTypeFilter}
                            onChange={(e) => setServiceTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer min-w-[180px] max-w-[250px]"
                        >
                            <option value="all">All Services</option>
                            {availableServiceTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-slate-400 pl-1 mb-0.5">Sort</label>
                        <button
                            onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors bg-white min-w-[140px]"
                            title="Toggle Sort Order"
                        >
                            <ArrowDownUp size={16} className="text-emerald-500" />
                            <span>{sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                        <p>Loading services...</p>
                    </div>
                ) : filteredServices.length > 0 ? (
                    <>
                        {/* Table View (Desktop) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Requested</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredServices.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${item.profile.role === 'admin' || item.profile.role === 'superuser'
                                                        ? 'bg-rose-500 text-white shadow-rose-200'
                                                        : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-200'
                                                        }`}>
                                                        {(item.profile.full_name?.[0] || item.profile.email?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-slate-800 text-[14px] tracking-tight leading-none">
                                                                {item.profile.full_name || 'New Client'}
                                                            </p>
                                                            {(item.profile.role === 'admin' || item.profile.role === 'superuser') && (
                                                                <span className="px-1.5 py-0.5 rounded-[4px] text-[7px] font-black bg-rose-500 text-white uppercase tracking-tighter">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-400 mt-1 lowercase tracking-tight">
                                                            {item.profile.email || 'no-email-synced'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                                        <Activity size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-700 leading-tight">{item.title || 'Untitled Service'}</p>
                                                        {item.description && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{item.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                                    {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    item.status === 'processing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        item.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' :
                                                        item.status === 'processing' ? 'bg-indigo-500 animate-pulse' :
                                                            item.status === 'rejected' ? 'bg-rose-500' :
                                                                'bg-amber-500 animate-pulse'
                                                        }`} />
                                                    {item.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <ServiceActions item={item} onUpdate={handleStatusUpdate} onDelete={deleteServiceRequest} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Card View (Mobile) */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {filteredServices.map(item => (
                                <div key={item.id} className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-slate-900 leading-tight">
                                                {item.profile.full_name || (item.profile.email?.includes('@') ? item.profile.email.split('@')[0] : item.profile.email) || 'New Client'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(item.status)}`}>
                                            {item.status || 'pending'}
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            <Activity size={14} className="text-indigo-600" />
                                            {item.title}
                                        </div>
                                        {item.profile.mobile && (
                                            <div className="text-[10px] text-slate-500 mt-2 font-mono">
                                                Mobile: {item.profile.mobile}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center gap-2 pt-2">
                                        <div className="text-[10px] text-slate-400 italic">Actions</div>
                                        <div className="flex gap-1">
                                            <ServiceActions item={item} onUpdate={handleStatusUpdate} onDelete={deleteServiceRequest} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <Activity size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No Services Found</h3>
                        <p className="text-slate-500 max-w-sm">No service requests match the current filters.</p>
                        <button
                            onClick={() => {
                                setStatusFilter('all');
                                setServiceTypeFilter('all');
                                setSearchQuery('');
                            }}
                            className="mt-4 px-4 py-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectionModal({ isOpen: false })} />
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative z-10 border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-black text-slate-800 mb-2">Reject Request</h3>
                        <p className="text-slate-500 text-xs font-medium mb-6 uppercase tracking-widest">Reason for rejecting {rejectionModal.title}</p>

                        <textarea
                            id="rejectionReason"
                            placeholder="Reason for rejection (e.g. Invalid documents, Out of scope)"
                            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none mb-6"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setRejectionModal({ isOpen: false })}
                                className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const reason = document.getElementById('rejectionReason').value
                                    if (!reason) return
                                    await handleStatusUpdate(rejectionModal.serviceId, 'rejected')
                                    try {
                                        await UserService.createNotification(
                                            rejectionModal.userId,
                                            'Service Request Rejected',
                                            `Your request for '${rejectionModal.title}' was rejected. Reason: ${reason}.`,
                                            'error'
                                        )
                                    } catch (e) { console.error(e) }
                                    setRejectionModal({ isOpen: false })
                                }}
                                className="py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                            >
                                Reject & Notify
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
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

export default AdminServices

// Reusable Sub-components for Cleanliness & Responsiveness
const StatBox = ({ label, count, icon: Icon, color }) => {
    const colorStyles = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100"
    };

    return (
        <div className={`bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4 group hover:shadow-xl transition-all duration-500 hover:-translate-y-1`}>
            <div className={`p-4 rounded-2xl ${colorStyles[color]} border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                <Icon size={24} />
            </div>
            <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</div>
                <div className="text-xl md:text-3xl font-black text-slate-800 leading-none">{count}</div>
            </div>
        </div>
    );
}

const ServiceActions = ({ item, onUpdate, onDelete }) => {
    const isActionable = item.status !== 'completed';
    const isProcessing = item.status === 'processing';

    return (
        <div className="flex items-center justify-end gap-2">
            {!isProcessing && item.status !== 'completed' && (
                <button
                    onClick={() => onUpdate(item.id, 'processing')}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-200 active:scale-95"
                >
                    <PlayCircle size={14} />
                    Process {item.profile.full_name}
                </button>
            )}

            {isProcessing && (
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl animate-in fade-in zoom-in duration-300">
                    <button
                        onClick={() => onUpdate(item.id, 'completed')}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm border border-emerald-100"
                        title="Mark as Completed"
                    >
                        <CheckCircle size={14} />
                        Complete
                    </button>
                    <button
                        onClick={() => setRejectionModal({
                            isOpen: true,
                            serviceId: item.id,
                            userId: item.user_id,
                            title: item.title
                        })}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm border border-rose-100"
                        title="Reject & Notify"
                    >
                        <XCircle size={14} />
                        Reject
                    </button>
                </div>
            )}

            <button
                onClick={() => onDelete(item.id)}
                className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                title="Delete Permanently"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
