import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Briefcase, Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowUpRight,
    FileText, UserPlus, Zap, Sparkles, Building2, ChevronRight, Activity, Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const PartnerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalClients: 0,
        activeRequests: 0,
        walletBalance: 0,
        completedServices: 0
    });
    const [recentClients, setRecentClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Clients onboarded by this partner
            const { data: clients, error: cError } = await supabase
                .from('profiles')
                .select('id, full_name, created_at, role, avatar_url')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });

            if (cError) throw cError;

            // 2. Fetch Services for these clients
            const clientIds = (clients || []).map(c => c.id);
            const { data: services, error: sError } = await supabase
                .from('user_services')
                .select('*')
                .or(`user_id.in.(${clientIds.length > 0 ? clientIds.join(',') : '00000000-0000-0000-0000-000000000000'}),partner_id.eq.${user.id}`);

            if (sError) throw sError;

            // 3. Fetch Wallet/Profile Info
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('wallet_balance')
                .eq('id', user.id)
                .single();

            if (pError) throw pError;

            const active = (services || []).filter(s => !['completed', 'rejected', 'cancelled'].includes(s.status)).length;
            const completed = (services || []).filter(s => s.status === 'completed').length;

            setStats({
                totalClients: clients?.length || 0,
                activeRequests: active,
                walletBalance: profile?.wallet_balance || 0,
                completedServices: completed
            });

            setRecentClients((clients || []).slice(0, 5));

        } catch (error) {
            console.error('Error fetching partner stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Initializing Partner Suite</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            {/* Header / Greeting */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, {user.full_name?.split(' ')[0]}</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Franchise Performance Overview • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/partner/onboard" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                        <UserPlus size={18} /> Onboard New Client
                    </Link>
                </div>
            </header>

            {/* Premium Stat Grid */}
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
                    link="/partner/clients"
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
                    value={`${stats.totalClients > 0 ? Math.round((stats.completedServices / (stats.totalClients || 1)) * 100) : 0}%`}
                    icon={Activity}
                    color="amber"
                    trend="Conversion"
                    link="/partner/clients"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Activity Feed Placeholder */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="bg-white rounded-[40px] p-10 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-110 transition-transform duration-1000"><Building2 size={200} /></div>

                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Growth Analytics</h3>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Client onboardings & service trends</p>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                                Live Tracking <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            </div>
                        </div>

                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50">
                            <TrendingUp className="text-slate-200" size={48} />
                            <div className="space-y-1">
                                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Analytics Initializing</p>
                                <p className="text-slate-300 text-[10px] font-medium max-w-xs px-6">Detailed growth charts and monthly revenue projections will appear as you scale your client base.</p>
                            </div>
                        </div>
                    </div>

                    {/* Success Portal Manual */}
                    <div className="bg-slate-900 rounded-[40px] p-10 md:p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                            <Zap className="text-amber-400" /> Partner Fast-Track Rules
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ManualCard
                                icon={Target}
                                title="Direct Uploads"
                                desc="Earn up to ₹2500 per service when you directly upload client requirements."
                                color="bg-indigo-500/20"
                            />
                            <ManualCard
                                icon={TrendingUp}
                                title="Passive Royalty"
                                desc="Earn 10-15% commission recurringly for every service your referred clients take in the future."
                                color="bg-emerald-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Quick Actions & Recent Clients */}
                <aside className="lg:col-span-4 flex flex-col gap-8">
                    {/* Recent Clients */}
                    <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm flex flex-col items-stretch">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-900 tracking-tight">Recent Onboardings</h3>
                            <Link to="/partner/clients" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">All</Link>
                        </div>

                        <div className="space-y-4 mb-8">
                            {recentClients.length === 0 ? (
                                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 italic text-xs">
                                    No clients registered yet
                                </div>
                            ) : (
                                recentClients.map(client => (
                                    <div key={client.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 shadow-sm overflow-hidden">
                                                {client.avatar_url ? <img src={client.avatar_url} className="w-full h-full object-cover" crossOrigin="anonymous" /> : client.full_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 tracking-tight truncate max-w-[120px]">{client.full_name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(client.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))
                            )}
                        </div>

                        <Link to="/partner/onboard" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center hover:bg-black transition-all shadow-xl active:scale-95">
                            Register New Node
                        </Link>
                    </div>

                    {/* Support Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[40px] p-8 border border-indigo-100 flex flex-col gap-6">
                        <div className="p-3 bg-white rounded-2xl shadow-sm self-start">
                            <MessageSquare size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h4 className="font-black text-indigo-900 tracking-tight mb-2">Priority Support</h4>
                            <p className="text-xs font-bold text-indigo-700/60 leading-relaxed uppercase tracking-wider">Contact your relationship manager for any platform issues or service escalations.</p>
                        </div>
                        <button className="w-full h-12 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            Connect with Admin
                        </button>
                    </div>
                </aside>
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

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all cursor-pointer">
            <Link to={link || '#'}>
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${colors[color]} border transition-transform group-hover:scale-110 duration-500 shadow-sm`}>
                        <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{trend}</span>
                </div>
                <div className="text-3xl font-black text-slate-950 mb-1">{value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</div>
            </Link>
        </motion.div>
    );
};

const ManualCard = ({ icon: Icon, title, desc, color }) => (
    <div className={`p-6 rounded-3xl ${color} border border-white/5 space-y-3 hover:bg-white/10 transition-colors`}>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Icon size={20} className="text-white" />
        </div>
        <h4 className="font-black text-white text-sm tracking-tight">{title}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">{desc}</p>
    </div>
);

const MessageSquare = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

export default PartnerDashboard;
