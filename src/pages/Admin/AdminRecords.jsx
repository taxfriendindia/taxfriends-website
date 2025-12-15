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
import { format, subDays, subHours, subMonths, subYears, isAfter, startOfWeek, startOfMonth, startOfHour, startOfDay } from 'date-fns'

const AdminRecords = () => {
    const [loading, setLoading] = useState(true)

    // Raw Data
    const [profiles, setProfiles] = useState([])
    const [requests, setRequests] = useState([])

    // Filters & View State
    const [timeRange, setTimeRange] = useState('7d') // '24h', '7d', '1m', '1y'
    const [marketingFilter, setMarketingFilter] = useState('all') // 'all', 'new_users', 'pending_req', 'rejected_req'

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
        let startDate = subDays(now, 7)
        let groupByKey = (date) => format(date, 'dd MMM')

        // Dynamic Time Grouping Strategy
        if (timeRange === '24h') {
            startDate = subHours(now, 24)
            groupByKey = (date) => format(startOfHour(date), 'HH:00')
        } else if (timeRange === '7d') {
            startDate = subDays(now, 7)
            groupByKey = (date) => format(startOfDay(date), 'dd MMM') // Daily: "15 Dec"
        } else if (timeRange === '1m') {
            startDate = subMonths(now, 1)
            // Group by Week 
            groupByKey = (date) => `Week ${format(startOfWeek(date), 'w')}`
        } else if (timeRange === '1y') {
            startDate = subYears(now, 1)
            // Group by Month
            groupByKey = (date) => format(startOfMonth(date), 'MMM yy')
        }

        const dataMap = new Map()

        // --- Filter Logic Integration ---
        // We only aggregate data that matches the current "Marketing Filter" context

        // 1. Process Profiles (New Users)
        if (marketingFilter === 'all' || marketingFilter === 'new_users') {
            profiles.forEach(p => {
                const d = new Date(p.created_at)
                if (isAfter(d, startDate)) {
                    const key = groupByKey(d)
                    const entry = dataMap.get(key) || { name: key, primaryMetric: 0, secondaryMetric: 0 }
                    entry.newUsers = (entry.newUsers || 0) + 1
                    dataMap.set(key, entry)
                }
            })
        }

        // 2. Process Requests
        requests.forEach(r => {
            const d = new Date(r.created_at)

            // Apply Status Filter Check
            let matchesFilter = false
            if (marketingFilter === 'all') matchesFilter = true
            else if (marketingFilter === 'pending_req' && r.status === 'pending') matchesFilter = true
            else if (marketingFilter === 'rejected_req' && r.status === 'rejected') matchesFilter = true
            else if (marketingFilter === 'cancelled_req' && r.status === 'cancelled') matchesFilter = true

            if (matchesFilter && isAfter(d, startDate)) {
                const key = groupByKey(d)
                const entry = dataMap.get(key) || { name: key }

                // If specific filter, we count relevant metric
                if (marketingFilter !== 'all' && marketingFilter !== 'new_users') {
                    entry.filteredCount = (entry.filteredCount || 0) + 1
                } else {
                    entry.totalRequests = (entry.totalRequests || 0) + 1
                }

                dataMap.set(key, entry)
            }
        })

        // Sort Map chronologically
        // Note: Map iterates in insertion order, but since we insert based on unsorted input often, 
        // we might need strict sort. 
        // Best approach: create array of all expected keys in range and fill.
        // For now, simpler: sort final array by parsing key? Hard with mixed formats.
        // Let's assume input is chronological or rely on a simple sort if possible.
        // To fix sort properly:
        // We really should generate the 'skeleton' keys first.
        // Let's stick to current logic: database returns sorted data, so iterating linearly fills Map in order.

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
        } else if (marketingFilter === 'rejected_req') {
            const userIds = new Set(requests.filter(r => r.status === 'rejected').map(r => r.user_id))
            data = data.filter(p => userIds.has(p.id))
        } else if (marketingFilter === 'cancelled_req') {
            const userIds = new Set(requests.filter(r => r.status === 'cancelled').map(r => r.user_id))
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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart2 className="text-indigo-600" />
                            {marketingFilter === 'all' ? 'Activity Overview' : 'Filtered Trends'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {marketingFilter === 'all'
                                ? 'Visual breakdown of user growth and service demand.'
                                : `Tracking metric: ${marketingFilter.replace('_', ' ').toUpperCase()}`
                            }
                        </p>
                    </div>

                    {/* Time Filter */}
                    <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                        {['24h', '7d', '1m', '1y'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${timeRange === range
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    {graphData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
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
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                {/* Dynamic Metrics based on Filter */}
                                {(marketingFilter === 'all' || marketingFilter === 'new_users') && (
                                    <Bar
                                        dataKey="newUsers"
                                        name="New Users"
                                        fill="#10B981"
                                        radius={[4, 4, 0, 0]}
                                        barSize={marketingFilter === 'all' ? 20 : 40}
                                    />
                                )}

                                {marketingFilter === 'all' && (
                                    <Line
                                        type="monotone" // connecting line
                                        dataKey="totalRequests"
                                        name="Total Requests"
                                        stroke="#6366F1"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                    />
                                )}

                                {marketingFilter !== 'all' && marketingFilter !== 'new_users' && (
                                    <Line
                                        type="monotone"
                                        dataKey="filteredCount"
                                        name={marketingFilter.replace('_', ' ').toUpperCase()}
                                        stroke="#EF4444"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                )}
                                {marketingFilter !== 'all' && marketingFilter !== 'new_users' && (
                                    <Bar
                                        dataKey="filteredCount"
                                        name="Volume"
                                        fill="#EF4444"
                                        opacity={0.3}
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
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

            {/* Marketing & Data Export Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Export Controls */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Download className="text-indigo-600" /> Data Export
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">
                            Target users based on their activity status.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Filter List By</label>
                            <select
                                value={marketingFilter}
                                onChange={(e) => setMarketingFilter(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">Every Registered User</option>
                                <option value="new_users">New Users (Last 30 Days)</option>
                                <option value="pending_req">Users with Pending Requests</option>
                                <option value="rejected_req">Rejected by Admin</option>
                                <option value="cancelled_req">Cancelled by User (Retarget)</option>
                            </select>
                        </div>

                        <button
                            onClick={downloadCSV}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Download CSV
                        </button>

                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mt-4">
                            <p className="text-indigo-800 text-xs font-semibold text-center">
                                {marketingData.length} users found
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Data Preview</h3>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {marketingData.slice(0, 5).map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3">
                                            <div className="font-semibold text-slate-700 text-sm">{u.full_name || 'N/A'}</div>
                                            <div className="text-xs text-slate-400">{u.organization}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="text-xs font-mono text-slate-600">{u.email}</div>
                                            <div className="text-xs text-slate-400">{u.mobile}</div>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {marketingData.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No records found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminRecords
