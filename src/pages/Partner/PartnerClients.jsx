import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, Mail, Phone, ExternalLink,
    Calendar, Briefcase, ChevronRight, UserPlus, MapPin,
    ArrowUpRight, Sparkles, Building2, Globe, X, Edit2, Save, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const PartnerClients = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [editingClient, setEditingClient] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleDeleteClient = async (clientId) => {
        if (!window.confirm('Are you sure you want to delete this client? All their service history will be lost.')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', clientId)
                .eq('partner_id', user.id);

            if (error) throw error;
            setClients(prev => prev.filter(c => c.id !== clientId));
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete client: ' + error.message);
        }
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingClient.full_name,
                    email: editingClient.email,
                    mobile_number: editingClient.mobile_number,
                    organization: editingClient.organization,
                    residential_city: editingClient.residential_city,
                    residential_state: editingClient.residential_state
                })
                .eq('id', editingClient.id);

            if (error) throw error;

            setClients(prev => prev.map(c => c.id === editingClient.id ? editingClient : c));
            setIsEditModalOpen(false);
            setEditingClient(null);
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update client: ' + error.message);
        } finally {
            setIsSaving(false);
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
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setEditingClient({ ...client }); setIsEditModalOpen(true); }}
                                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/edit"
                                        title="Edit Profile"
                                    >
                                        <Edit2 size={14} className="group-hover/edit:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm group/del"
                                        title="Delete Client"
                                    >
                                        <X size={14} className="group-hover/del:rotate-90 transition-transform" />
                                    </button>
                                    <Link
                                        to={`/partner/onboard?clientId=${client.id}`}
                                        className="h-10 px-5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm"
                                    >
                                        Process Service
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Edit Client Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => setIsEditModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden"
                        >
                            <div className="bg-slate-900 p-8 text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={120} /></div>
                                <h3 className="text-2xl font-black tracking-tight relative z-10">Edit Client Node</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] relative z-10">Updating infrastructure for {editingClient?.full_name}</p>
                            </div>

                            <form onSubmit={handleUpdateClient} className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            required
                                            value={editingClient?.full_name || ''}
                                            onChange={e => setEditingClient({ ...editingClient, full_name: e.target.value })}
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                        <input
                                            required
                                            value={editingClient?.mobile_number || ''}
                                            onChange={e => setEditingClient({ ...editingClient, mobile_number: e.target.value })}
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            value={editingClient?.email || ''}
                                            onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization (Optional)</label>
                                        <input
                                            value={editingClient?.organization || ''}
                                            onChange={e => setEditingClient({ ...editingClient, organization: e.target.value })}
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                                        <input
                                            value={editingClient?.residential_city || ''}
                                            onChange={e => setEditingClient({ ...editingClient, residential_city: e.target.value })}
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                                        <input
                                            value={editingClient?.residential_state || ''}
                                            onChange={e => setEditingClient({ ...editingClient, residential_state: e.target.value })}
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 h-14 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-2 h-14 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
                                    >
                                        {isSaving ? <Sparkles className="animate-spin" size={16} /> : <Save size={16} />}
                                        Update Node
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
