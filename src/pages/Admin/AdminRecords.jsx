import React, { useEffect, useState, useMemo } from 'react'
import { Download, BarChart2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { format, subDays, subHours, subMonths, subYears, isAfter, startOfWeek, startOfMonth, startOfHour, startOfDay, endOfDay } from 'date-fns'

const AdminRecords = () => {
    const [loading, setLoading] = useState(true)

    // Raw Data
    const [profiles, setProfiles] = useState([])
    const [requests, setRequests] = useState([])

    // Filters & View State
    const [timeRange, setTimeRange] = useState('7d') // '24h', '7d', '1m', '1y'
    const [marketingFilter, setMarketingFilter] = useState('all') // 'all', 'new_users', 'pending_req', 'rejected_req'
    const [graphMetric, setGraphMetric] = useState('overview') // 'overview', 'clients', 'partners', 'services'

    useEffect(() => {
        fetchAllData()
    }, [timeRange])

    const fetchAllData = async () => {
        try {
            setLoading(true)

            if (profiles.length > 0 && requests.length > 0) {
                setLoading(false)
                return
            }

            const { data: profs } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: true })

            const { data: servicereqs } = await supabase
                .from('user_services')
                .select('*')
                .order('created_at', { ascending: true })

            setProfiles(profs || [])
            setRequests(servicereqs || [])

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // --- Graph Data Generation ---
    const graphData = useMemo(() => {
        if (loading) return []

        const now = new Date()
        const dataMap = new Map()

        let startDate = startOfDay(subDays(now, 6)) // default
        let getNextDate = (d, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
        let formatKey = (d) => format(d, 'dd MMM')
        let iterations = 7

        // 1. Configure Range
        if (timeRange === '24h') {
            startDate = startOfHour(subHours(now, 23))
            getNextDate = (d, i) => new Date(d.getTime() + i * 60 * 60 * 1000)
            formatKey = (d) => format(d, 'HH:00')
            iterations = 24
        } else if (timeRange === '7d') {
            startDate = startOfDay(subDays(now, 6))
            iterations = 7
        } else if (timeRange === '1m') {
            startDate = startOfDay(subDays(now, 29))
            iterations = 30
        } else if (timeRange === '1y') {
            startDate = startOfMonth(subMonths(now, 11))
            getNextDate = (d, i) => new Date(d.getFullYear(), d.getMonth() + i, 1)
            formatKey = (d) => format(d, 'MMM yy')
            iterations = 12
        } else if (timeRange === 'all') {
            // Find earliest date
            let minTime = now.getTime()
            if (profiles.length > 0) minTime = Math.min(minTime, new Date(profiles[0].created_at).getTime())
            if (requests.length > 0) minTime = Math.min(minTime, new Date(requests[0].created_at).getTime())

            startDate = startOfDay(new Date(minTime))
            const diffDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
            iterations = Math.max(diffDays + 1, 7) // at least 7 days

            // If range is huge (> 1 year), group by Month. Otherwise keep Day-wise.
            if (iterations > 400) {
                startDate = startOfMonth(startDate)
                iterations = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24 * 30)) + 1
                getNextDate = (d, i) => new Date(d.getFullYear(), d.getMonth() + i, 1)
                formatKey = (d) => format(d, 'MMM yy')
            }
        }

        // 2. Pre-fill Map (Continuous Axis)
        for (let i = 0; i < iterations; i++) {
            const d = getNextDate(startDate, i)
            if (d > endOfDay(now)) break;

            const key = formatKey(d)
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    name: key,
                    totalUsers: 0,
                    clientsJoined: 0,
                    partnersJoined: 0,
                    servicesRequested: 0,
                    rawDate: d
                })
            }
        }

        // 3. Populate
        const processItem = (date, type, item) => {
            const d = new Date(date)
            if (d < startDate) return

            const key = formatKey(d)
            if (dataMap.has(key)) {
                const entry = dataMap.get(key)
                if (type === 'profile') {
                    entry.totalUsers += 1
                    if (item.role === 'partner') entry.partnersJoined += 1
                    else if (['admin', 'superuser'].includes(item.role)) {
                        // Admins not specifically shown in these bars
                    } else {
                        // 'user', 'client', or null/undefined
                        entry.clientsJoined += 1
                    }
                } else if (type === 'request') {
                    entry.servicesRequested += 1
                }
            }
        }

        profiles.forEach(p => processItem(p.created_at, 'profile', p))
        requests.forEach(r => processItem(r.created_at, 'request', r))

        return Array.from(dataMap.values())
    }, [profiles, requests, timeRange, loading, marketingFilter])

    // --- Marketing Data Filter (List View) ---
    const marketingData = useMemo(() => {
        let data = [...profiles]

        if (marketingFilter === 'new_users') {
            const cutOff = subDays(new Date(), 30)
            data = data.filter(p => isAfter(new Date(p.created_at), cutOff))
        } else if (marketingFilter === 'pending_req') {
            const userIds = new Set(requests.filter(r => r.status === 'pending').map(r => r.user_id))
            data = data.filter(p => userIds.has(p.id))
        } else if (marketingFilter === 'rejected_cancelled_req') {
            const userIds = new Set(requests.filter(r => r.status === 'cancelled' || r.status === 'rejected').map(r => r.user_id))
            data = data.filter(p => userIds.has(p.id))
        }

        return data
    }, [profiles, requests, marketingFilter])

    const downloadCSV = () => {
        const headers = ["Full Name", "Email", "Mobile", "Organization", "Joined Date"]
        const rows = marketingData.map(u => [
            u.full_name || "",
            u.email || "",
            u.mobile || "",
            u.organization || "",
            new Date(u.created_at).toLocaleDateString()
        ])

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `marketing_data_${marketingFilter}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Records & Analytics</h1>
                <p className="text-slate-500 mt-1">Deep dive into platform data and export user lists.</p>
            </div>

            {/* Analytics Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart2 className="text-emerald-600" />
                            {marketingFilter === 'all' ? 'Activity Overview' : 'Filtered Trends'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Platform growth and demand analytics.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Categorical Filter */}
                        <div className="relative">
                            <select
                                value={marketingFilter}
                                onChange={(e) => setMarketingFilter(e.target.value)}
                                className="pl-5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors appearance-none shadow-sm"
                            >
                                <option value="all">Global Activity</option>
                                <option value="new_users">Recent Users</option>
                                <option value="pending_req">Action Required</option>
                                <option value="rejected_cancelled_req">Dropped Requests</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner h-[34px]">
                            {['24h', '7d', '1m', '1y'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${timeRange === range
                                        ? 'bg-white text-emerald-600 shadow-sm scale-105'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Graph View Mode */}
                        <div className="flex bg-emerald-50/50 p-1 rounded-xl border border-emerald-100/50 h-[34px]">
                            {['overview', 'clients', 'partners', 'services'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setGraphMetric(m)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black capitalize transition-all ${graphMetric === m
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-emerald-400 hover:text-emerald-600'
                                        }`}
                                >
                                    {m === 'overview' ? 'Full View' : m}
                                </button>
                            ))}
                        </div>

                        {/* Export Action */}
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                        >
                            <Download size={14} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <div className="h-[400px] w-full py-4">
                    {graphData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={graphData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 min-w-[180px]">
                                                    <p className="text-xs font-black text-slate-400 mb-3 border-b pb-2 uppercase tracking-widest">{label}</p>
                                                    <div className="space-y-2">
                                                        {payload.map((entry, index) => (
                                                            <div key={index} className="flex justify-between items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}:</span>
                                                                </div>
                                                                <span className="text-sm font-black text-slate-800">{entry.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px' }}
                                />

                                {/* Complex Metrics */}
                                {(graphMetric === 'overview' || graphMetric === 'clients') && (
                                    <Bar
                                        dataKey="clientsJoined"
                                        name="New Clients"
                                        fill="#8B5CF6"
                                        radius={[10, 10, 0, 0]}
                                        barSize={graphMetric === 'overview' ? 12 : 60}
                                    />
                                )}
                                {(graphMetric === 'overview' || graphMetric === 'partners') && (
                                    <Bar
                                        dataKey="partnersJoined"
                                        name="New Partners"
                                        fill="#F43F5E"
                                        radius={[10, 10, 0, 0]}
                                        barSize={graphMetric === 'overview' ? 12 : 60}
                                    />
                                )}
                                {(graphMetric === 'overview' || graphMetric === 'services') && (
                                    <Line
                                        type="monotone"
                                        dataKey="servicesRequested"
                                        name="Service Requests"
                                        stroke="#F59E0B"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                )}
                                {graphMetric === 'overview' && (
                                    <Line
                                        type="step"
                                        dataKey="totalUsers"
                                        name="Total Registrations"
                                        stroke="#94A3B8"
                                        strokeWidth={2}
                                        strokeDasharray="8 4"
                                        dot={false}
                                    />
                                )}

                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <BarChart2 size={48} className="mb-4 opacity-20" />
                            <p>No activity data found for this period.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Preview Table (Full Width) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800">Recent Activity Data</h3>
                        <p className="text-xs text-slate-400 mt-1">Showing latest {marketingData.length} entries for the selected filter.</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Live Update
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber / Entity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Registration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {marketingData.slice(0, 15).map(u => (
                                <tr key={u.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700 text-sm group-hover:text-emerald-600 transition-colors">{u.full_name || 'Anonymous User'}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{u.organization || 'No Organization'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{u.email}</div>
                                        <div className="text-[10px] font-black text-slate-400 font-mono">{u.mobile_number || 'No Phone'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-xs font-black text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">
                                            {new Date(u.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {marketingData.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No records found matching filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminRecords
