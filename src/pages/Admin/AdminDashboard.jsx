import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, FileText, Activity, Clock, TrendingUp, ArrowDown, BarChart2, XCircle } from 'lucide-react'
import { AdminService } from '../../services/adminService'
import { useNavigate } from 'react-router-dom'


const AdminDashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalUsers: 0, newUsers: 0, totalReqs: 0, rejectedReqs: 0 })
    const [recentActivity, setRecentActivity] = useState([])
    const [showRejectedModal, setShowRejectedModal] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const statsData = await AdminService.getStats()
                setStats(statsData)

                const activityFeed = await AdminService.getRecentActivity()
                setRecentActivity(activityFeed)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back. Here is what is happening today.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    count={stats.totalUsers}
                    sub="Lifetime Registrations"
                    icon={Users}
                    color="bg-blue-500"
                    onClick={() => navigate('/admin/clients')}
                />
                <StatCard
                    title="Total Requests"
                    count={stats.totalReqs}
                    sub="All time service requests"
                    icon={Activity}
                    color="bg-indigo-500"
                    onClick={() => navigate('/admin/services')}
                />
                <StatCard
                    title="Rejected / Cancelled"
                    count={stats.rejectedReqs}
                    sub="Lost opportunities"
                    icon={ArrowDown}
                    color="bg-red-500"
                    onClick={() => setShowRejectedModal(true)}
                />
                <StatCard
                    title="Records & Data"
                    count="View"
                    sub="Analytics & Exports"
                    icon={BarChart2}
                    color="bg-purple-500"
                    onClick={() => navigate('/admin/records')}
                />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center bg-slate-50">
                    <Clock className="text-indigo-600 mr-2" size={20} />
                    <h2 className="font-bold text-lg text-slate-800">Recent Activity</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">No recent activity found.</div>
                    ) : (
                        recentActivity.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (item.type === 'doc') navigate('/admin/documents')
                                    else if (item.type === 'user') navigate('/admin/clients')
                                    else navigate('/admin/services')
                                }}
                                className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shadow-sm ${item.type === 'doc' ? 'bg-amber-100 text-amber-600' :
                                        item.type === 'user' ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {item.type === 'doc' ? <FileText size={18} /> :
                                            item.type === 'user' ? <Users size={18} /> :
                                                <Activity size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{item.text}</p>
                                        <p className="text-xs text-slate-500">{new Date(item.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${item.status === 'verified' || item.status === 'joined' || item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {item.status || 'pending'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <RejectedBreakdownModal isOpen={showRejectedModal} onClose={() => setShowRejectedModal(false)} />
        </div>
    )
}

const StatCard = ({ title, count, sub, icon: Icon, color, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group cursor-pointer h-full"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className={`font-black text-slate-900 ${typeof count === 'string' ? 'text-xl mt-1.5' : 'text-2xl'}`}>{count}</h3>
                <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
            <div className={`p-3 rounded-xl ${color} text-white shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
        </div>
    </div>
)

const RejectedBreakdownModal = ({ isOpen, onClose }) => {
    const [rejections, setRejections] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) fetchBreakdown()
    }, [isOpen])

    const fetchBreakdown = async () => {
        setLoading(true)
        try {
            // Fetch rejected/cancelled services with joins
            const { data, error } = await supabase
                .from('user_services')
                .select('*, profiles:user_id(full_name, email), service_catalog:service_id(title)')
                .in('status', ['rejected', 'cancelled'])
                .order('updated_at', { ascending: false })
                .limit(20)

            if (error) throw error

            setRejections(data || [])

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600">
                            <ArrowDown size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Rejection Analysis</h3>
                            <p className="text-xs text-red-600/80 font-medium">Recent Rejected Requests</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
                        </div>
                    ) : rejections.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <p>No rejected requests found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {rejections.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                                        <XCircle size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 text-sm">{item.service_catalog?.title || 'Unknown Service'}</h4>
                                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 font-bold uppercase">Rejected</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Client: <span className="font-semibold text-slate-700">{item.profiles?.full_name || 'Unknown'}</span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Updated: {new Date(item.updated_at || item.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400">Showing latest {rejections.length} rejected/cancelled requests.</p>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
