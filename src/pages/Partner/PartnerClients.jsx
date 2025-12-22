import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, Mail, Phone, ExternalLink,
    Calendar, Briefcase, ChevronRight, UserPlus, MapPin,
    ArrowUpRight, Sparkles, Building2, Globe
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const PartnerClients = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All'); // 'All', 'Business', 'Individual'

    useEffect(() => {
        if (user) fetchClients();
    }, [user]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching partner clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = clients.filter(c => {
        const matchesSearch =
            c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.mobile_number?.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.organization?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterType === 'Business') return !!c.organization;
        if (filterType === 'Individual') return !c.organization;

        return true;
    });

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20 px-1 md:px-0">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Client Network
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] uppercase tracking-widest border border-blue-100">{clients.length} Total</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Manage and track clients onboarded through your franchise</p>
                </div>
                <Link to="/partner/onboard" className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 whitespace-nowrap">
                    <UserPlus size={18} /> Add New Subscriber
                </Link>
            </header>

            {/* Premium Filter Bar */}
            <div className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by identity, organization or contact data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full lg:w-auto">
                    {['All', 'Business', 'Individual'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`flex-1 lg:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white rounded-[32px] border border-slate-100 animate-pulse shadow-sm" />)
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-32 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                            <Users size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 font-black text-xs uppercase tracking-widest italic">No matching records found</p>
                            <p className="text-slate-300 text-[10px] font-medium max-w-xs mx-auto">Try adjusting your search filters or check your spelling.</p>
                        </div>
                    </div>
                ) : (
                    filtered.map((client, idx) => (
                        <motion.div
                            key={client.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-600/20 transition-all group relative overflow-hidden flex flex-col"
                        >
                            {/* Accent Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors duration-500" />

                            <div className="relative flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-2xl overflow-hidden group-hover:scale-105 transition-transform">
                                    {client.avatar_url ? (
                                        <img src={client.avatar_url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        client.full_name?.[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">{client.full_name || 'Anonymous Client'}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${client.organization ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                                            {client.organization ? 'Business' : 'Individual'}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">ID: {client.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative space-y-3 mb-8 flex-1">
                                <DataField icon={Mail} value={client.email} />
                                <DataField icon={Phone} value={client.mobile_number || 'No contact registered'} />
                                {client.organization && <DataField icon={Building2} value={client.organization} highlight />}
                                <DataField icon={MapPin} value={`${client.residential_city || 'Regional'}, ${client.residential_state || 'Center'}`} />
                            </div>

                            <div className="relative flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Subscriber Since</span>
                                    <span className="text-[10px] font-black text-slate-500">{new Date(client.created_at).toLocaleDateString()}</span>
                                </div>
                                <button className="h-10 px-5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm group/btn">
                                    Portal Access <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

const DataField = ({ icon: Icon, value, highlight }) => (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${highlight
            ? 'bg-blue-50/50 border-blue-100/50 text-blue-700'
            : 'bg-slate-50/50 border-slate-100/50 text-slate-600'
        }`}>
        <Icon size={16} className={highlight ? 'text-blue-500' : 'text-slate-300'} />
        <span className="text-xs font-bold truncate tracking-tight">{value}</span>
    </div>
);

export default PartnerClients;
