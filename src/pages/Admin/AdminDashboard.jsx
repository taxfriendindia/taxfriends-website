import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Users, FileText, Activity, Clock, TrendingUp, BarChart,
    PieChart as PieIcon, MapPin, Shield, Zap, Filter, ChevronDown, Download
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart as ReBarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { UserService } from '../../services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, newUsers: 0, totalReqs: 0, rejectedReqs: 0, totalPayouts: 0 });
    const [chartData, setChartData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [adminPerformance, setAdminPerformance] = useState({});
    const [expandedAdmin, setExpandedAdmin] = useState(null);

    // Advanced Filters (Super User only)
    const [filters, setFilters] = useState({ state: 'All', city: 'All', admin: 'All', partner: 'All' });
    const [allAdmins, setAllAdmins] = useState([]);
    const [allPartners, setAllPartners] = useState([]);
    const [availableStates, setAvailableStates] = useState(['All']);
    const [availableCities, setAvailableCities] = useState(['All']);

    useEffect(() => {
        loadData();
    }, [filters]); // Reload on filter change

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch stats, activity, daily stats, and performance separately for robustness
            const fetchStats = async () => {
                try { return await AdminService.getStats(filters); }
                catch (e) { console.error("Stats Fetch Error:", e); return { totalUsers: 0, newUsers: 0, totalReqs: 0, rejectedReqs: 0 }; }
            };

            const fetchActivity = async () => {
                try { return await AdminService.getRecentActivity(); }
                catch (e) { console.error("Activity Fetch Error:", e); return []; }
            };

            const fetchDaily = async () => {
                try { return await AdminService.getDailyStats(); }
                catch (e) { console.error("Daily Stats Error:", e); return []; }
            };

            const fetchPerformance = async () => {
                try { return await AdminService.getAdminPerformance(); }
                catch (e) { console.error("Performance Fetch Error:", e); return {}; }
            };

            const [statsData, activityFeed, dailyStats, performance] = await Promise.all([
                fetchStats(),
                fetchActivity(),
                fetchDaily(),
                fetchPerformance()
            ]);

            setStats(statsData);
            setRecentActivity(activityFeed);
            setAdminPerformance(performance || {});

            // Format chart data
            const formattedCharts = (dailyStats || []).reverse().map(d => ({
                name: d.day ? new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' }) : 'N/A',
                requests: d.total_requests || 0,
                completed: d.completed || 0
            }));
            setChartData(formattedCharts);

            // Fetch admins and partners for filters (Allowed for both Admin and SuperUser)
            try {
                const { data: staff } = await supabase.from('profiles').select('id, full_name, role').in('role', ['admin', 'superuser', 'partner']);
                setAllAdmins(staff?.filter(s => ['admin', 'superuser'].includes(s.role)) || []);
                setAllPartners(staff?.filter(s => s.role === 'partner') || []);

                // Fetch dynamic locations
                const { data: locs } = await supabase.from('profiles').select('residential_state, residential_city, business_state, business_city').not('role', 'in', '("admin","superuser")');
                const states = [...new Set((locs || []).flatMap(l => [l.residential_state, l.business_state]).filter(Boolean))];
                const cities = [...new Set((locs || []).flatMap(l => [l.residential_city, l.business_city]).filter(Boolean))];
                setAvailableStates(['All', ...states.sort()]);
                setAvailableCities(['All', ...cities.sort()]);
            } catch (staffError) {
                console.error("Staff/Location Fetch Error:", staffError);
            }

            // Trigger Lazy Cleanup for old automated notifications (24hr shelf life)
            UserService.cleanupNotifications();

        } catch (e) {
            console.error("Critical Dashboard Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const isSuper = user?.role === 'superuser';

    return (
        <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10 px-1 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        {isSuper ? <Shield className="text-emerald-600 shrink-0" /> : <Activity className="text-emerald-500 shrink-0" />}
                        <span className="truncate">{isSuper ? 'Super Admin Control' : 'Administrator Dashboard'}</span>
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium">Business intelligence and service tracking.</p>
                </div>
                {isSuper && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilters({ state: 'All', city: 'All', admin: 'All', partner: 'All' })}
                            className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                        >
                            Reset
                        </button>
                        <button onClick={() => navigate('/admin/records')} className="flex-[2] md:flex-none px-4 py-2 bg-emerald-600 border border-emerald-600 rounded-xl text-xs md:text-sm font-bold text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                            <Download size={14} /> Export Reports
                        </button>
                        <button
                            onClick={() => navigate('/admin/super-reset')}
                            className="flex-1 md:flex-none px-4 py-2 bg-rose-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
                        >
                            <Zap size={14} /> System Reset
                        </button>
                    </div>
                )}
            </div>

            {/* Advanced Filters Bar (Superuser Only) */}
            {isSuper && (
                <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                    <DashboardFilter
                        label="State"
                        icon={MapPin}
                        value={filters.state}
                        options={availableStates}
                        onChange={v => setFilters({ ...filters, state: v })}
                    />
                    <DashboardFilter
                        label="City"
                        icon={MapPin}
                        value={filters.city}
                        options={availableCities}
                        onChange={v => setFilters({ ...filters, city: v })}
                    />
                    <DashboardFilter
                        label="Sudo User"
                        icon={Shield}
                        value={filters.admin}
                        options={[{ label: 'All', value: 'All' }, ...allAdmins.map(a => ({ label: a.full_name, value: a.id }))]}
                        onChange={v => setFilters({ ...filters, admin: v })}
                        color="emerald"
                    />
                    <DashboardFilter
                        label="Partner"
                        icon={Zap}
                        value={filters.partner}
                        options={[{ label: 'All', value: 'All' }, ...allPartners.map(p => ({ label: p.full_name, value: p.id }))]}
                        onChange={v => setFilters({ ...filters, partner: v })}
                    />
                    <button className="col-span-2 lg:col-span-1 h-[42px] bg-slate-900 text-white rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">
                        <Filter size={14} /> Apply Filters
                    </button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Total Clients" count={stats.totalUsers} sub="Network Size" icon={Users} color="bg-violet-600" shadow="shadow-violet-500/20" path="/admin/clients" />
                <StatCard title="Active Requests" count={stats.totalReqs} sub="Pipeline" icon={Activity} color="bg-amber-500" shadow="shadow-amber-500/20" path="/admin/services" />
                <StatCard title="Total Payouts" count={`₹${stats.totalPayouts.toLocaleString()}`} sub="Paid Out" icon={Shield} color="bg-teal-600" shadow="shadow-teal-500/20" path="/admin/partners" />
                <StatCard title="Total Partners" count={allPartners.length} sub="Franchisees" icon={Zap} color="bg-rose-500" shadow="shadow-rose-500/20" path="/admin/clients?view=partners" />
            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Graph */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Service Performance</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Last 7 Days activity</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600" /> <span className="text-[10px] font-bold text-slate-400 uppercase">Requests</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-200" /> <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span></div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="99%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" />
                                <Area type="monotone" dataKey="completed" stroke="#f59e0b" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Side Stats */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Role Distribution</h3>
                    <div className="h-[200px] w-full mt-4">
                        <ResponsiveContainer width="99%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Clients', value: stats.totalUsers },
                                        { name: 'Sudo Admins', value: allAdmins.length },
                                        { name: 'Partners', value: allPartners.length }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#8b5cf6" />
                                    <Cell fill="#f59e0b" />
                                    <Cell fill="#ec4899" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
                        <div className="text-center">
                            <div className="text-2xl font-black text-slate-800">{allAdmins.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Sudo Admins</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-slate-800">{allPartners.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Franchisess</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center">
                            <Clock className="text-emerald-600 mr-2" size={20} />
                            <h2 className="font-black text-slate-800 tracking-tight uppercase tracking-widest text-sm">Recent Activity</h2>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentActivity.map((item, idx) => {
                            const status = item.status?.toUpperCase() || 'LOGGED';
                            const statusStyles = {
                                'JOINED': 'bg-blue-50 text-blue-600 border-blue-100',
                                'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
                                'VERIFIED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                'REJECTED': 'bg-red-50 text-red-600 border-red-100',
                                'LOGGED': 'bg-slate-50 text-slate-500 border-slate-100'
                            }[status] || 'bg-slate-50 text-slate-500 border-slate-100';

                            return (
                                <div key={idx} className="p-4 hover:bg-slate-50/80 flex items-center justify-between transition-colors cursor-pointer group">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform ${status === 'PENDING' ? 'bg-amber-100/50' :
                                            status === 'JOINED' ? 'bg-blue-100/50' :
                                                status === 'VERIFIED' ? 'bg-emerald-100/50' : 'bg-slate-100'
                                            }`}>
                                            <Activity size={18} className={
                                                status === 'PENDING' ? 'text-amber-600' :
                                                    status === 'JOINED' ? 'text-blue-600' :
                                                        status === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-400'
                                            } />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.text}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{new Date(item.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusStyles}`}>
                                        {status}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sudo Admin Tracking (Super only) */}
                {isSuper && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <Shield size={18} className="text-emerald-600" /> Sudo User Performance
                        </h3>
                        <div className="space-y-4">
                            {allAdmins.map(admin => {
                                const perf = adminPerformance[admin.id] || { completed: 0, rejected: 0, verified: 0, processing: 0, total: 0 };
                                const isExpanded = expandedAdmin === admin.id;

                                return (
                                    <div key={admin.id} className="border border-slate-100 rounded-2xl overflow-hidden transition-all group">
                                        <div
                                            onClick={() => setExpandedAdmin(isExpanded ? null : admin.id)}
                                            className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 border-white shadow-sm group-hover:scale-110 transition-transform ${['bg-gradient-to-tr from-emerald-500 to-teal-600', 'bg-gradient-to-tr from-teal-500 to-cyan-500', 'bg-gradient-to-tr from-emerald-600 to-emerald-400', 'bg-gradient-to-tr from-green-500 to-emerald-500'][admin.id?.charCodeAt(0) % 4]
                                                    }`}>
                                                    {admin.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{admin.full_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Status
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <div className="text-sm font-black text-slate-800">{perf.completed}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Resolved</div>
                                                </div>
                                                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-600' : ''}`}>
                                                    <ChevronDown size={20} className="text-slate-300" />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-4 pb-4 bg-slate-50/50"
                                                >
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                                        <PerformanceStat label="Verified" count={perf.verified} color="text-emerald-600" bg="bg-emerald-50" />
                                                        <PerformanceStat label="Processing" count={perf.processing} color="text-blue-600" bg="bg-blue-50" />
                                                        <PerformanceStat label="Pending" count={perf.pending} color="text-amber-600" bg="bg-amber-50" />
                                                        <PerformanceStat label="Rejected" count={perf.rejected} color="text-red-600" bg="bg-red-50" />
                                                    </div>
                                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
                                                        <span className="text-slate-400">Total Lifecycle Handled</span>
                                                        <span className="text-slate-800">{perf.total} Requests</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ title, count, sub, icon: Icon, color, shadow, path }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => path && navigate(path)}
            className={`bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm ${path ? 'cursor-pointer' : ''} hover:shadow-2xl hover:${shadow} hover:-translate-y-1.5 transition-all group overflow-hidden relative`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-700`} />
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${color} text-white shadow-lg ${shadow} transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    <Icon size={24} />
                </div>
                <div className="p-1 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={14} className="text-slate-400" />
                </div>
            </div>
            <div className="relative z-10">
                <div className="text-3xl font-black text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">{count}</div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{title}</div>
                <div className="flex items-center gap-2 mt-3">
                    <div className={`h-1 flex-1 rounded-full ${color} opacity-10`} />
                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{sub}</span>
                </div>
            </div>
        </div>
    );
};

const DashboardFilter = ({ label, icon: Icon, value, options, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-600 outline-none transition-all appearance-none"
            >
                {options.map(opt => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    const val = typeof opt === 'string' ? opt : opt.value;
                    return <option key={val} value={val}>{label}</option>
                })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
        </div>
    </div>
);

const PerformanceStat = ({ label, count, color, bg }) => (
    <div className={`${bg} p-3 rounded-xl border border-white shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105`}>
        <div className={`text-lg font-black ${color}`}>{count}</div>
        <div className="text-[8px] font-black uppercase tracking-tighter text-slate-400">{label}</div>
    </div>
);

export default AdminDashboard;
