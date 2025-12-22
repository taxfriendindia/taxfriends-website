import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Briefcase, Wallet, TrendingUp, Activity, ArrowUpRight,
    UserPlus, Zap, Search, Filter, Edit2, Trash2, Plus, FileText,
    CheckCircle2, Clock, AlertCircle, Target, Sparkles, History,
    Eye, Download, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const PartnerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalClients: 0,
        activeRequests: 0,
        walletBalance: 0,
        completedServices: 0
    });
    const [clients, setClients] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [filters, setFilters] = useState({
        clientSearch: '',
        serviceFilter: 'All',
        statusFilter: 'All'
    });
    const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'services'
    const [expandedService, setExpandedService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all clients
            const { data: clientsData, error: cError } = await supabase
                .from('profiles')
                .select('*')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });

            if (cError) throw cError;

            // Fetch all services with full details
            const clientIds = (clientsData || []).map(c => c.id);
            const { data: servicesData, error: sError } = await supabase
                .from('user_services')
                .select(`
                    *,
                    client:user_id(id, full_name, email, mobile_number, organization),
                    service:service_id(id, title, description, icon)
                `)
                .or(`user_id.in.(${clientIds.length > 0 ? clientIds.join(',') : '00000000-0000-0000-0000-000000000000'}),partner_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (sError) throw sError;

            // Fetch wallet balance
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('wallet_balance')
                .eq('id', user.id)
                .single();

            if (pError) throw pError;

            const active = (servicesData || []).filter(s => !['completed', 'rejected', 'cancelled'].includes(s.status)).length;
            const completed = (servicesData || []).filter(s => s.status === 'completed').length;

            setStats({
                totalClients: clientsData?.length || 0,
                activeRequests: active,
                walletBalance: profile?.wallet_balance || 0,
                completedServices: completed
            });

            setClients(clientsData || []);
            setAllServices(servicesData || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c => {
        const matchesSearch =
            c.full_name?.toLowerCase().includes(filters.clientSearch.toLowerCase()) ||
            c.email?.toLowerCase().includes(filters.clientSearch.toLowerCase()) ||
            c.mobile_number?.includes(filters.clientSearch);
        return matchesSearch;
    });

    const filteredServices = allServices
        .filter(s => filters.serviceFilter === 'All' || s.service?.title === filters.serviceFilter)
        .filter(s => filters.statusFilter === 'All' || s.status === filters.statusFilter);

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

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 px-4">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Welcome, {user.user_metadata?.full_name?.split(' ')[0] || 'Partner'}
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                        Franchise Performance Overview • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <Link
                    to="/partner/onboard"
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
                >
                    <UserPlus size={18} /> Onboard New Client
                </Link>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Client Network"
                    value={stats.totalClients}
                    icon={Users}
                    color="blue"
                    trend="+12%"
                    link="/partner/clients"
                />
                <StatCard
                    label="Active Files"
                    value={stats.activeRequests}
                    icon={Briefcase}
                    color="indigo"
                    trend="In Progress"
                />
                <StatCard
                    label="Wallet Balance"
                    value={`₹${stats.walletBalance.toLocaleString()}`}
                    icon={Wallet}
                    color="emerald"
                    trend="Earnings"
                    link="/partner/wallet"
                />
                <StatCard
                    label="Success Rate"
                    value={`${stats.totalClients > 0 ? Math.round((stats.completedServices / stats.totalClients) * 100) : 0}%`}
                    icon={Target}
                    color="amber"
                    trend="Conversion"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Client Directory & Service History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setActiveTab('clients')}
                                className={`flex-1 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'clients'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <Users size={16} className="inline mr-2" />
                                Client Directory
                            </button>
                            <button
                                onClick={() => setActiveTab('services')}
                                className={`flex-1 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'services'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <History size={16} className="inline mr-2" />
                                Service History
                            </button>
                        </div>

                        {/* Client Directory Tab */}
                        {activeTab === 'clients' && (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Client Directory</h3>
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                            Manage your {clients.length} onboarded clients
                                        </p>
                                    </div>
                                    <Link
                                        to="/partner/clients"
                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-sm whitespace-nowrap"
                                    >
                                        View All Clients
                                    </Link>
                                </div>

                                {/* Search Bar */}
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or phone..."
                                        value={filters.clientSearch}
                                        onChange={(e) => setFilters(f => ({ ...f, clientSearch: e.target.value }))}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>

                                {/* Client List */}
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {filteredClients.length === 0 ? (
                                        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                            <Users className="mx-auto mb-4 text-slate-300" size={48} />
                                            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">
                                                {filters.clientSearch ? 'No matching clients found' : 'No clients yet'}
                                            </p>
                                            <p className="text-slate-300 text-xs mt-2">
                                                {filters.clientSearch ? 'Try a different search term' : 'Start by onboarding your first client'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredClients.map((client, idx) => (
                                            <motion.div
                                                key={client.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                                            {client.avatar_url ? (
                                                                <img src={client.avatar_url} className="w-full h-full object-cover rounded-xl" crossOrigin="anonymous" />
                                                            ) : (
                                                                client.full_name?.[0]?.toUpperCase() || 'C'
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-black text-slate-900 tracking-tight truncate">
                                                                {client.full_name || 'Anonymous Client'}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 font-bold truncate">
                                                                {client.email || client.mobile_number || 'No contact info'}
                                                            </p>
                                                            {client.organization && (
                                                                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mt-1">
                                                                    {client.organization}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => navigate(`/partner/clients`)}
                                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                            title="View Details"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/partner/onboard?clientId=${client.id}`)}
                                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-black transition-all"
                                                        >
                                                            Add Service
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Service History Tab */}
                        {activeTab === 'services' && (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Service History</h3>
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                            All service requests ({allServices.length} total)
                                        </p>
                                    </div>
                                </div>

                                {/* Service Filters */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <select
                                        value={filters.serviceFilter}
                                        onChange={(e) => setFilters(f => ({ ...f, serviceFilter: e.target.value }))}
                                        className="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="All">All Services</option>
                                        {[...new Set(allServices.map(s => s.service?.title))].filter(Boolean).map(title => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filters.statusFilter}
                                        onChange={(e) => setFilters(f => ({ ...f, statusFilter: e.target.value }))}
                                        className="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                {/* Service List */}
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {filteredServices.length === 0 ? (
                                        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                            <FileText className="mx-auto mb-4 text-slate-300" size={48} />
                                            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">
                                                No service requests found
                                            </p>
                                            <p className="text-slate-300 text-xs mt-2">
                                                Create your first service request to get started
                                            </p>
                                        </div>
                                    ) : (
                                        filteredServices.map((service, idx) => (
                                            <motion.div
                                                key={service.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all"
                                            >
                                                <div
                                                    className="p-4 bg-slate-50 cursor-pointer hover:bg-white transition-all"
                                                    onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusColor(service.status)}`}>
                                                                    {service.status}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400">
                                                                    #{service.id.slice(0, 8)}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-black text-slate-900 text-sm tracking-tight mb-1">
                                                                {service.service?.title || 'Unknown Service'}
                                                            </h4>
                                                            <p className="text-xs text-slate-600 font-bold">
                                                                Client: {service.client?.full_name || 'Unknown'}
                                                            </p>
                                                            {service.client?.organization && (
                                                                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mt-1">
                                                                    {service.client.organization}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created</p>
                                                                <p className="text-xs font-black text-slate-700">
                                                                    {new Date(service.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            {expandedService === service.id ? (
                                                                <ChevronUp size={20} className="text-slate-400" />
                                                            ) : (
                                                                <ChevronDown size={20} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                <AnimatePresence>
                                                    {expandedService === service.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="border-t border-slate-200 bg-white"
                                                        >
                                                            <div className="p-4 space-y-3">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Description</p>
                                                                        <p className="text-xs text-slate-700 font-medium">
                                                                            {service.service?.description || 'No description available'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Contact</p>
                                                                        <p className="text-xs text-slate-700 font-medium">
                                                                            {service.client?.email || service.client?.mobile_number || 'Not provided'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {service.comments && (
                                                                    <div>
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Comments</p>
                                                                        <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-lg">
                                                                            {service.comments}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2 pt-2">
                                                                    <button className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all">
                                                                        <Eye size={14} className="inline mr-1" /> View Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Commission Info */}
                    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-xl font-black mb-2 italic">Earn ₹300 - ₹500 Fixed Commission</h4>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                                Simply onboard clients and help them with document uploads to earn instant wallet credits.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Zap size={100} className="text-amber-400" />
                        </div>
                    </div>
                </div>

                {/* Right: Quick Service Tracker */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm sticky top-4">
                        <div className="mb-6">
                            <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2 text-lg">
                                <Activity size={20} className="text-indigo-600" /> Quick Tracker
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Recent service updates
                            </p>
                        </div>

                        {/* Recent Services */}
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {allServices.slice(0, 10).map(service => (
                                <div key={service.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded ${service.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                service.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {service.status}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400">
                                            {new Date(service.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs font-black text-slate-800 tracking-tight truncate">
                                        {service.service?.title || 'Unknown Service'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 truncate">
                                        {service.client?.full_name || 'Client'}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Link
                            to="/partner/onboard"
                            className="mt-6 w-full h-12 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus size={16} className="mr-2" /> Create Service Request
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, trend, link }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    const content = (
        <>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${colors[color]} border transition-transform group-hover:scale-110 duration-500 shadow-sm`}>
                    <Icon size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                    {trend}
                </span>
            </div>
            <div className="text-3xl font-black text-slate-950 mb-1">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</div>
        </>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[28px] p-8 border border-slate-200 shadow-sm group hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
        >
            {link ? <Link to={link}>{content}</Link> : content}
        </motion.div>
    );
};

export default PartnerDashboard;
