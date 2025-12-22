import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, FileText, CheckCircle, XCircle, Calendar, Search, Filter, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AdminActivityModal = ({ isOpen, onClose, admin }) => {
    const [activeTab, setActiveTab] = useState('all') // 'all', 'completed', 'rejected'
    const [searchTerm, setSearchTerm] = useState('')

    if (!isOpen || !admin) return null

    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    React.useEffect(() => {
        if (isOpen) {
            fetchActivity()
        }
    }, [isOpen, admin])

    const fetchActivity = async () => {
        try {
            setLoading(true)
            // Fetch latest services activity
            // Since we don't track admin_id, we show ALL system activity
            // This is a tradeoff. Ideally update user_services to track 'updated_by'
            const { data, error } = await supabase
                .from('user_services')
                .select('*, profiles:user_id(full_name, email, residential_city, city)')
                .order('updated_at', { ascending: false })
                .limit(50)

            if (error) throw error

            const formatted = data.map(item => ({
                id: item.id,
                type: item.status || 'pending',
                client: item.profiles?.full_name || item.profiles?.email?.split('@')[0] || 'Unknown User',
                location: item.profiles?.residential_city || item.profiles?.city || 'Unknown',
                service: item.title,
                date: new Date(item.updated_at || item.created_at).toLocaleDateString(),
                time: new Date(item.updated_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                rawDate: new Date(item.updated_at || item.created_at)
            }))

            setActivities(formatted)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredActivities = activities.filter(item => {
        if (activeTab !== 'all' && item.type !== activeTab) return false
        if (searchTerm && !item.client.toLowerCase().includes(searchTerm.toLowerCase()) && !item.service.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
    })

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-white">
                                {admin.avatar_url ? (
                                    <img src={admin.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    (admin.full_name?.charAt(0) || 'A').toUpperCase()
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{admin.full_name}</h3>
                                <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Viewing Admin Activity Log
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-white items-center justify-between">
                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                            {['all', 'completed', 'rejected', 'processed'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab
                                        ? 'bg-white text-emerald-600 shadow-sm scale-100'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="w-full sm:w-auto sm:flex-1 relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-0">
                        {filteredActivities.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <FileText size={24} className="opacity-40" />
                                </div>
                                <p>No activity records found matching your filters.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-slate-200">Status</th>
                                        <th className="px-6 py-3 border-b border-slate-200">Client Details</th>
                                        <th className="px-6 py-3 border-b border-slate-200">Service Info</th>
                                        <th className="px-6 py-3 border-b border-slate-200 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm bg-white">
                                    {filteredActivities.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group cursor-default">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide ${log.type === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    log.type === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        'bg-blue-50 text-blue-700 border-blue-100'
                                                    }`}>
                                                    {log.type === 'completed' && <CheckCircle size={10} className="mr-1.5" />}
                                                    {log.type === 'rejected' && <XCircle size={10} className="mr-1.5" />}
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                                        {log.client}
                                                    </div>
                                                    <div className="text-xs text-slate-400 flex items-center mt-0.5">
                                                        <MapPin size={10} className="mr-1" />
                                                        {log.location}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-700 font-medium">{log.service}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-mono text-xs text-slate-500">{log.date}</div>
                                                <div className="text-[10px] text-slate-400 font-bold">{log.time}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
                        * Data shown is for demonstration. Actual audit logs require backend integration.
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default AdminActivityModal
