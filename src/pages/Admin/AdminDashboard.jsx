import React, { useEffect, useState } from 'react'
import { Users, FileText, Activity, Clock, TrendingUp, ArrowDown, BarChart2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { subDays, isAfter } from 'date-fns'

const AdminDashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalUsers: 0, newUsers: 0, totalReqs: 0, rejectedReqs: 0 })
    const [recentActivity, setRecentActivity] = useState([])

    useEffect(() => {
        const load = async () => {
            try {
                // 1. Optimized Stats Fetching (Count only, no data)
                const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
                const { count: totalReqs } = await supabase.from('user_services').select('*', { count: 'exact', head: true })
                const { count: rejectedReqs } = await supabase.from('user_services').select('*', { count: 'exact', head: true }).in('status', ['rejected', 'cancelled'])

                // For "New Users" we need a date filter, so we can't use head:true easily without a filter, 
                // but count with filter works efficiently in Supabase.
                const recentTime = subDays(new Date(), 30).toISOString()
                const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', recentTime)

                setStats({
                    totalUsers: totalUsers || 0,
                    newUsers: newUsers || 0,
                    totalReqs: totalReqs || 0,
                    rejectedReqs: rejectedReqs || 0
                })

                // 2. Recent Activity Feed (Limit 3 is already efficient)
                const { data: recentDocs } = await supabase.from('user_documents')
                    .select('created_at, name, status').order('created_at', { ascending: false }).limit(3)

                const { data: recentServs } = await supabase.from('user_services')
                    .select('created_at, title, status').order('created_at', { ascending: false }).limit(3)

                const feed = [
                    ...(recentDocs || []).map(x => ({ type: 'doc', text: `Uploaded: ${x.name}`, date: x.created_at, status: x.status })),
                    ...(recentServs || []).map(x => ({ type: 'service', text: `Service: ${x.title}`, date: x.created_at, status: x.status }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

                setRecentActivity(feed)

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
                    onClick={() => navigate('/admin/services', { state: { statusFilter: 'rejected' } })}
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
                                onClick={() => navigate(item.type === 'doc' ? '/admin/documents' : '/admin/services')}
                                className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shadow-sm ${item.type === 'doc' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {item.type === 'doc' ? <FileText size={18} /> : <Activity size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{item.text}</p>
                                        <p className="text-xs text-slate-500">{new Date(item.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${item.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
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

export default AdminDashboard
