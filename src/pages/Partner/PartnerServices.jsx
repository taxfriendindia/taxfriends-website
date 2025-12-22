import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Search, Filter, CheckCircle2, Clock, AlertCircle,
    XCircle, Loader, ChevronDown, ChevronUp, Eye, Calendar,
    User, Briefcase, TrendingUp, Download, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const PartnerServices = () => {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expandedService, setExpandedService] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        cancelled: 0
    });

    useEffect(() => {
        if (user) fetchServices();
    }, [user]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            console.log('=== FETCHING SERVICES ===');
            console.log('Partner user ID:', user.id);

            // First, get all clients onboarded by this partner
            const { data: clients, error: clientError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('partner_id', user.id);

            if (clientError) {
                console.error('Error fetching clients:', clientError);
            } else {
                console.log('Found clients:', clients);
            }

            const clientIds = (clients || []).map(c => c.id);
            console.log('Client IDs:', clientIds);

            // Build the query
            let query = supabase
                .from('user_services')
                .select(`
                    *,
                    profiles!user_services_user_id_fkey(id, full_name, email, mobile_number, organization, avatar_url),
                    service_catalog(id, title, description, icon)
                `)
                .order('created_at', { ascending: false });

            // Apply OR filter for partner_id OR user_id in client list
            if (clientIds.length > 0) {
                query = query.or(`partner_id.eq.${user.id},user_id.in.(${clientIds.join(',')})`);
            } else {
                // If no clients, just get services where partner_id matches
                query = query.eq('partner_id', user.id);
            }

            const { data: servicesData, error } = await query;

            if (error) {
                console.error('Error fetching services:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
            } else {
                console.log('Fetched services:', servicesData);
                console.log('Number of services:', servicesData?.length || 0);
            }

            setServices(servicesData || []);

            // Calculate stats
            const total = servicesData?.length || 0;
            const pending = servicesData?.filter(s => s.status === 'pending').length || 0;
            const processing = servicesData?.filter(s => s.status === 'processing').length || 0;
            const completed = servicesData?.filter(s => s.status === 'completed').length || 0;
            const rejected = servicesData?.filter(s => s.status === 'rejected').length || 0;
            const cancelled = servicesData?.filter(s => s.status === 'cancelled').length || 0;

            console.log('Stats:', { total, pending, processing, completed, rejected, cancelled });
            setStats({ total, pending, processing, completed, rejected, cancelled });

        } catch (error) {
            console.error('Unexpected error in fetchServices:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(s => {
        const matchesSearch =
            s.service_catalog?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.profiles?.organization?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            processing: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            rejected: 'bg-rose-100 text-rose-700 border-rose-200',
            cancelled: 'bg-slate-100 text-slate-700 border-slate-200'
        };
        return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: Clock,
            processing: Loader,
            completed: CheckCircle2,
            rejected: XCircle,
            cancelled: AlertCircle
        };
        return icons[status] || AlertCircle;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading Services...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 px-4">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Service Requests
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm uppercase tracking-widest border border-indigo-100">
                            {stats.total} Total
                        </span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                        Track all service requests from your client network
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchServices}
                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <Link
                        to="/partner/onboard"
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Create New Request
                    </Link>
                </div>
            </header>

            {/* Status Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatusCard
                    label="Total"
                    value={stats.total}
                    icon={FileText}
                    color="slate"
                    onClick={() => setStatusFilter('All')}
                    active={statusFilter === 'All'}
                />
                <StatusCard
                    label="Pending"
                    value={stats.pending}
                    icon={Clock}
                    color="amber"
                    onClick={() => setStatusFilter('pending')}
                    active={statusFilter === 'pending'}
                />
                <StatusCard
                    label="Processing"
                    value={stats.processing}
                    icon={Loader}
                    color="blue"
                    onClick={() => setStatusFilter('processing')}
                    active={statusFilter === 'processing'}
                />
                <StatusCard
                    label="Completed"
                    value={stats.completed}
                    icon={CheckCircle2}
                    color="emerald"
                    onClick={() => setStatusFilter('completed')}
                    active={statusFilter === 'completed'}
                />
                <StatusCard
                    label="Rejected"
                    value={stats.rejected}
                    icon={XCircle}
                    color="rose"
                    onClick={() => setStatusFilter('rejected')}
                    active={statusFilter === 'rejected'}
                />
                <StatusCard
                    label="Cancelled"
                    value={stats.cancelled}
                    icon={AlertCircle}
                    color="slate"
                    onClick={() => setStatusFilter('cancelled')}
                    active={statusFilter === 'cancelled'}
                />
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by service name, client name, or organization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Service List */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-black text-slate-900 text-lg">
                        {statusFilter === 'All' ? 'All Services' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Services`}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                        Showing {filteredServices.length} of {stats.total} services
                    </p>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredServices.length === 0 ? (
                        <div className="py-20 text-center">
                            <FileText className="mx-auto mb-4 text-slate-300" size={64} />
                            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">
                                {searchTerm ? 'No matching services found' : 'No service requests yet'}
                            </p>
                            <p className="text-slate-300 text-xs mt-2">
                                {searchTerm ? 'Try a different search term' : 'Service requests will appear here'}
                            </p>
                        </div>
                    ) : (
                        filteredServices.map((service, idx) => {
                            const StatusIcon = getStatusIcon(service.status);
                            const isExpanded = expandedService === service.id;

                            return (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="hover:bg-slate-50 transition-all"
                                >
                                    <div
                                        className="p-6 cursor-pointer"
                                        onClick={() => setExpandedService(isExpanded ? null : service.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                {/* Client Avatar */}
                                                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                                                    {service.profiles?.avatar_url ? (
                                                        <img src={service.profiles.avatar_url} className="w-full h-full object-cover rounded-xl" crossOrigin="anonymous" />
                                                    ) : (
                                                        service.profiles?.full_name?.[0]?.toUpperCase() || 'C'
                                                    )}
                                                </div>

                                                {/* Service Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusColor(service.status)}`}>
                                                            <StatusIcon size={12} className="inline mr-1" />
                                                            {service.status}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400">
                                                            #{service.id.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-slate-900 text-base tracking-tight mb-1">
                                                        {service.service_catalog?.title || 'Unknown Service'}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-xs text-slate-600 font-bold">
                                                        <span className="flex items-center gap-1">
                                                            <User size={14} className="text-slate-400" />
                                                            {service.profiles?.full_name || 'Unknown Client'}
                                                        </span>
                                                        {service.profiles?.organization && (
                                                            <span className="flex items-center gap-1">
                                                                <Briefcase size={14} className="text-slate-400" />
                                                                {service.profiles.organization}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            {new Date(service.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expand Icon */}
                                            <div className="shrink-0">
                                                {isExpanded ? (
                                                    <ChevronUp size={24} className="text-slate-400" />
                                                ) : (
                                                    <ChevronDown size={24} className="text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-t border-slate-100 bg-slate-50/50"
                                            >
                                                <div className="p-6 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Description</p>
                                                            <p className="text-sm text-slate-700 font-medium bg-white p-4 rounded-xl border border-slate-200">
                                                                {service.service_catalog?.description || 'No description available'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Contact</p>
                                                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                                                                <p className="text-sm text-slate-700 font-medium">
                                                                    📧 {service.profiles?.email || 'Not provided'}
                                                                </p>
                                                                <p className="text-sm text-slate-700 font-medium">
                                                                    📱 {service.profiles?.mobile_number || 'Not provided'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {service.comments && (
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Comments</p>
                                                            <p className="text-sm text-slate-700 font-medium bg-white p-4 rounded-xl border border-slate-200">
                                                                {service.comments}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3 pt-2">
                                                        <button className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                                            <Eye size={16} /> View Full Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const StatusCard = ({ label, value, icon: Icon, color, onClick, active }) => {
    const colors = {
        slate: active ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300',
        amber: active ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300',
        blue: active ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300',
        emerald: active ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300',
        rose: active ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300',
    };

    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${colors[color]} ${active ? 'shadow-lg scale-105' : 'hover:shadow-md'}`}
        >
            <div className="flex items-center justify-between mb-2">
                <Icon size={20} />
                <span className="text-2xl font-black">{value}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-left">{label}</p>
        </button>
    );
};

export default PartnerServices;
