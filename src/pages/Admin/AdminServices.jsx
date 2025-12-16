import React, { useState, useEffect } from 'react'
import { Activity, ExternalLink, Filter, CheckCircle, XCircle, Clock, PlayCircle, ArrowDownUp, Search, Trash2, Users, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { UserService } from '../../services/userService'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AdminServices = () => {
    const { user } = useAuth()
    const location = useLocation()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)

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

            // 1. Fetch Services
            const { data: servs, error } = await supabase
                .from('user_services')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            // 2. Fetch Profiles (Users + Admins)
            // Get unique user IDs
            const userIds = [...new Set((servs || []).map(s => s.user_id))]
            const serviceIds = [...new Set((servs || []).map(s => s.service_id))]

            const [profilesResponse, catalogResponse, adminsResponse] = await Promise.all([
                supabase.from('profiles').select('id, full_name, email, mobile, role').in('id', userIds),
                supabase.from('service_catalog').select('id, title').in('id', serviceIds),
                supabase.from('profiles').select('id, full_name, role').in('role', ['admin', 'superuser']) // Fetch admins
            ])

            const profileMap = (profilesResponse.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
            const catalogMap = (catalogResponse.data || []).reduce((acc, item) => ({ ...acc, [item.id]: item }), {})

            setAdmins(adminsResponse.data || [])

            const joinedServices = (servs || []).map(s => {
                const p = profileMap[s.user_id]
                return {
                    ...s,
                    profile: p ? {
                        ...p,
                        full_name: p.full_name || p.email?.split('@')[0] || 'Unknown User'
                    } : { full_name: 'Unknown User', email: 'No Email', role: 'client' },
                    title: catalogMap[s.service_id]?.title || 'Unknown Service'
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
                return s.admin_id === adminFilter
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
            // We update the status AND the admin_id to track who performed the action
            const { error } = await supabase
                .from('user_services')
                .update({
                    status: newStatus,
                    admin_id: user.id
                })
                .eq('id', id)

            if (error) throw error

            setServices(services.map(s =>
                s.id === id ? { ...s, status: newStatus, admin_id: user.id } : s
            ))
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status. Ensure "admin_id" column exists in database.')
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

            {/* Performance Stats Cards (Dynamic based on Filter) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.approved}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-red-50 text-red-600">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.rejected}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
                    </div>
                </div>
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
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer min-w-[160px]"
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
                            className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer min-w-[140px]"
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
                            className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer min-w-[180px] max-w-[250px]"
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
                            <ArrowDownUp size={16} className="text-indigo-500" />
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service Requested</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredServices.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                {item.profile.full_name || 'Unknown'}
                                                {(item.profile.role === 'admin' || item.profile.role === 'superuser') && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">{item.profile.email}</div>
                                            {item.profile.mobile && <div className="text-xs text-slate-400 font-mono mt-0.5">{item.profile.mobile}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-700 font-medium">
                                                <div className="p-2 bg-indigo-50 rounded-lg mr-3 text-indigo-600">
                                                    <Activity size={18} />
                                                </div>
                                                {item.title || 'Untitled Service'}
                                            </div>
                                            {item.description && (
                                                <div className="text-xs text-slate-500 mt-1 max-w-xs truncate" title={item.description}>
                                                    {item.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                                                {item.status === 'completed' && <CheckCircle size={12} className="mr-1.5" />}
                                                {item.status === 'processing' && <PlayCircle size={12} className="mr-1.5" />}
                                                {item.status === 'rejected' && <XCircle size={12} className="mr-1.5" />}
                                                {(item.status === 'pending' || !item.status) && <Clock size={12} className="mr-1.5" />}
                                                <span className="capitalize">{item.status || 'pending'}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {/* Action Buttons */}
                                            {/* Action Buttons */}
                                            {item.status !== 'processing' && item.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'processing')}
                                                    className="inline-flex items-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Mark as Processing"
                                                >
                                                    <PlayCircle size={18} />
                                                </button>
                                            )}

                                            {item.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'completed')}
                                                    className="inline-flex items-center p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                                    title="Mark as Completed"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}

                                            {item.status !== 'rejected' && (
                                                <button
                                                    onClick={async () => {
                                                        const reason = prompt("Enter rejection reason:", "Information incomplete/incorrect")
                                                        if (reason === null) return

                                                        // Optimistic Update
                                                        handleStatusUpdate(item.id, 'rejected')

                                                        // Send Notification
                                                        try {
                                                            await UserService.createNotification(
                                                                item.user_id,
                                                                'Service Request Rejected',
                                                                `Your request for '${item.title}' was rejected. Reason: ${reason}. Please contact support.`,
                                                                'error'
                                                            )
                                                        } catch (e) {
                                                            console.error("Notify failed", e)
                                                        }
                                                    }}
                                                    className="inline-flex items-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Reject & Notify"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}

                                            {/* Delete Option */}
                                            <button
                                                onClick={() => deleteServiceRequest(item.id)}
                                                className="inline-flex items-center p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                title="Delete Permanently"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminServices
