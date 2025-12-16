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
            // Stop if future (for small 'All' ranges that pad to 7 days, or ensuring we don't go past 'now' too much)
            // Actually nice to see up to today.
            if (d > endOfDay(now)) break;

            const key = formatKey(d)
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    name: key,
                    newUsers: 0,
                    totalRequests: 0,
                    filteredCount: 0,
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
                    if (marketingFilter === 'all' || marketingFilter === 'new_users') {
                        entry.newUsers += 1
                    }
                } else if (type === 'request') {
                    let matchesFilter = false
                    if (marketingFilter === 'all') matchesFilter = true
                    else if (marketingFilter === 'pending_req' && item.status === 'pending') matchesFilter = true
                    else if (marketingFilter === 'rejected_cancelled_req' && (item.status === 'cancelled' || item.status === 'rejected')) matchesFilter = true

                    if (matchesFilter) {
                        if (marketingFilter !== 'all' && marketingFilter !== 'new_users') entry.filteredCount += 1
                        else entry.totalRequests += 1
                    }
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
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart2 className="text-indigo-600" />
                            {marketingFilter === 'all' ? 'Activity Overview' : 'Filtered Trends'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {marketingFilter === 'all'
                                ? 'Visual breakdown of user growth and service demand.'
                                : `Tracking metric: ${marketingFilter === 'new_users' ? 'NEW USERS' : marketingFilter.replace('_', ' ').toUpperCase()}`
                            }
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={marketingFilter}
                                onChange={(e) => setMarketingFilter(e.target.value)}
                                className="pl-6 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors appearance-none shadow-sm"
                            >
                                <option value="all">Every Registered User</option>
                                <option value="new_users">New Users (Last 30 Days)</option>
                                <option value="pending_req">Users with Pending Requests</option>
                                <option value="rejected_cancelled_req">Rejected or Cancelled Requests</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full shadow-lg shadow-slate-900/20 transition-all active:scale-95 hover:-translate-y-0.5"
                        >
                            <Download size={18} />
                            Export
                        </button>

                        {/* Time Filter */}
                        <div className="flex bg-slate-100 p-1.5 rounded-full">
                            {['24h', '7d', '1m', '1y'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${timeRange === range
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
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
                                        name="Registrations"
                                        fill="#10B981"
                                        radius={[4, 4, 0, 0]}
                                        barSize={marketingFilter === 'all' ? 20 : 40}
                                    />
                                )}

                                {marketingFilter === 'all' && (
                                    <Line
                                        type="monotone" // connecting line
                                        dataKey="totalRequests"
                                        name="Services Requested"
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

            {/* Data Preview Table (Full Width) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Data Preview ({marketingData.length} records)</h3>
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
                            {marketingData.slice(0, 10).map(u => (
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
                            No records found matching filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminRecords
