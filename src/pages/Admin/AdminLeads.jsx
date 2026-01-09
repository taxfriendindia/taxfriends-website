import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Calendar, Trash2, Search, Filter, RefreshCw, CheckCircle2, AlertCircle, MessageSquare, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import StatusModal from '../../components/StatusModal'
import ConfirmationModal from '../../components/ConfirmationModal'

const AdminLeads = () => {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, leadId: null })

    useEffect(() => {
        fetchLeads()
    }, [])

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setLeads(data || [])
        } catch (error) {
            console.error('Error fetching leads:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, leadId: id })
    }

    const executeDelete = async () => {
        const id = confirmModal.leadId
        try {
            const { error } = await supabase
                .from('contact_messages')
                .delete()
                .eq('id', id)

            if (error) throw error

            setLeads(leads.filter(l => l.id !== id))
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Deleted',
                message: 'Lead message removed successfully.'
            })
        } catch (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to delete lead.'
            })
        } finally {
            setConfirmModal({ isOpen: false, leadId: null })
        }
    }

    const filteredLeads = leads.filter(lead =>
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.service?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={36} />
                        Contact Leads
                    </h1>
                    <p className="text-slate-500 font-medium">Manage and respond to website inquiries</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 w-full md:w-64 transition-all text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={fetchLeads}
                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Leads Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode='popLayout'>
                    {filteredLeads.map((lead, index) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            key={lead.id}
                            className="group bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-blue-200/30 transition-all border-l-8 border-l-blue-600"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900">{lead.name}</h3>
                                    <div className="flex items-center gap-4 text-sm font-bold">
                                        <a href={`mailto:${lead.email}`} className="text-blue-600 flex items-center gap-1.5 hover:underline">
                                            <Mail size={14} /> {lead.email}
                                        </a>
                                        <a href={`tel:${lead.phone}`} className="text-emerald-600 flex items-center gap-1.5 hover:underline">
                                            <Phone size={14} /> {lead.phone}
                                        </a>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(lead.id)}
                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                                        Interest: {lead.service || 'General Inquiry'}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        <Calendar size={14} />
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed font-medium bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    "{lead.message}"
                                </p>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Reply via WhatsApp →
                                </div>
                                <a
                                    href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${lead.name},\n\nThis is regarding your inquiry for *${lead.service || 'Tax Services'}* on TaxFriend India.\n\n*Your Inquiry:* ${lead.message}\n\nHow can we assist you further today?`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                >
                                    Open WhatsApp <ArrowRight size={14} />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && filteredLeads.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 shadow-sm">
                            <MessageSquare size={40} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-800">No Leads Found</h3>
                            <p className="text-slate-500 text-sm">When someone fills the contact form, it will appear here.</p>
                        </div>
                    </div>
                )}
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
                onConfirm={executeDelete}
                title="SURELY DELETE LEAD?"
                message="This will permanently remove this inquiry from your records. This action cannot be undone."
                danger={true}
            />
        </div>
    )
}

export default AdminLeads
