import React, { useState, useEffect } from 'react'
import { Megaphone, Send, Users, ShieldAlert, CheckCircle, Info, Sparkles, Layout } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import StatusModal from '../../components/StatusModal'
import ConfirmationModal from '../../components/ConfirmationModal'

const AdminAnnouncements = () => {
    const [message, setMessage] = useState('')
    const [title, setTitle] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [stats, setStats] = useState({ totalUsers: 0, sentCount: 0 })
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: () => { } })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        // Fetch ALL profiles to get the accurate count
        const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        if (error) {
            console.error("Error counting users:", error)
        }
        setStats(prev => ({ ...prev, totalUsers: count || 0 }))
    }

    const handleBroadcast = async () => {
        if (!message.trim() || !title.trim()) {
            setStatusModal({
                isOpen: true,
                type: 'warning',
                title: 'Missing Fields',
                message: 'Please enter both title and message.'
            })
            return
        }

        setConfirmModal({
            isOpen: true,
            onConfirm: executeBroadcast
        })
    }

    const executeBroadcast = async () => {

        setIsSending(true)
        try {
            // Prepared Notification Object (Global Broadcast)
            const notification = {
                user_id: null,
                title: title,
                message: message,
                type: 'broadcast',
                is_read: false,
                created_at: new Date()
            }

            // Single Insert
            const { error: iError } = await supabase
                .from('notifications')
                .insert(notification)

            if (iError) throw iError

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Broadcast Sent',
                message: `Successfully broadcasted to all ${stats.totalUsers} platform users.`
            })
            setMessage('')
            setTitle('')
        } catch (error) {
            console.error('Broadcast failed:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Broadcast Failed',
                message: error.message || 'Check database permissions.'
            })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] space-y-4 max-w-7xl mx-auto overflow-hidden"
        >
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-emerald-600 rounded-lg text-white shadow-lg shadow-emerald-600/20">
                            <Megaphone size={16} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                            Broadcast Announcements
                        </h1>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Instantly distribute updates to your entire network.</p>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Users size={18} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-slate-800 leading-none">{stats.totalUsers.toLocaleString()}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Reach</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0">
                {/* Main Composition Area */}
                <div className="lg:col-span-2 h-full min-h-0 flex flex-col">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group flex-1 flex flex-col min-h-0">
                        <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0 gap-6">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4 shrink-0">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="text-emerald-600" size={18} />
                                    Draft New Message
                                </h2>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-3 py-1 rounded-full">
                                    Broadcast Mode
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 min-w-0 space-y-4">
                                <div className="shrink-0">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Message Heading</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-base text-slate-800 placeholder:text-slate-300 transition-all"
                                        placeholder="e.g. GST Filing Deadline Approaching"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Detailed Content</label>
                                    <textarea
                                        className="flex-1 w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none text-slate-700 leading-relaxed placeholder:text-slate-300 transition-all font-medium text-sm"
                                        placeholder="Write your announcement details here..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-between items-center mt-2 shrink-0">
                                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                            <Info size={10} /> Markdown supported
                                        </div>
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                            {message.length.toLocaleString()} / 2000
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100/50 flex-1">
                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <CheckCircle size={14} />
                                    </div>
                                    <p className="text-[10px] font-bold leading-tight">
                                        Confirmed distribution to <span className="font-black underline">{stats.totalUsers} profiles</span>
                                    </p>
                                </div>

                                <button
                                    onClick={handleBroadcast}
                                    disabled={isSending || !title.trim() || !message.trim()}
                                    className="relative group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-xl blur opacity-30 group-hover/btn:opacity-60 transition duration-1000 group-hover/btn:duration-200"></div>
                                    <div className="relative px-6 py-3.5 bg-emerald-600 rounded-xl flex items-center gap-2 text-white font-black uppercase tracking-widest text-[10px] transition duration-200 group-hover/btn:bg-emerald-700 active:scale-95">
                                        {isSending ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                Broadcasting...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={14} /> Send Broadcast
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-emerald-900 rounded-[1.5rem] p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden shrink-0">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                            <Layout size={18} /> Message Rules
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex gap-2">
                                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">1</div>
                                <p className="text-[11px] text-emerald-100 font-medium">Broadcasts cannot be recalled once dispatched. Review carefully.</p>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">2</div>
                                <p className="text-[11px] text-emerald-100 font-medium">Keep titles concise to ensure they display correctly on mobile.</p>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">3</div>
                                <p className="text-[11px] text-emerald-100 font-medium">Avoid excessive punctuation for higher professional impact.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-amber-50 rounded-[1.5rem] p-6 border border-amber-100 shrink-0">
                        <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2 text-sm">
                            <ShieldAlert size={16} /> Safety Notice
                        </h3>
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            Bypassing individual settings may impact experience. Use only for high-priority platform updates.
                        </p>
                    </div>
                </div>
            </div>

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title="Confirm Broadcast"
                message={`Are you sure you want to send this announcement to ALL ${stats.totalUsers} users? This action cannot be undone.`}
                danger={true}
                confirmLabel="Yes, Broadcast"
            />
        </motion.div>
    )
}

export default AdminAnnouncements
