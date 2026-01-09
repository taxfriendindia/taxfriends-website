import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Calendar, Trash2, Search, RefreshCw, MessageSquare, ExternalLink, Download, User, Briefcase, FileText } from 'lucide-react'
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

    const handleDeleteClick = (id) => {
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
                message: 'Lead permanently removed from database.'
            })
        } catch (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Delete Failed',
                message: 'Could not delete lead. Please ensure the DELETE policy is applied in Supabase.'
            })
        } finally {
            setConfirmModal({ isOpen: false, leadId: null })
        }
    }

    const exportToExcel = () => {
        if (leads.length === 0) return

        const headers = ['Date', 'Name', 'Email', 'Phone', 'Service', 'Message']
        const csvContent = [
            headers.join(','),
            ...leads.map(lead => [
                new Date(lead.created_at).toLocaleDateString(),
                `"${lead.name?.replace(/"/g, '""')}"`,
                lead.email,
                lead.phone,
                `"${lead.service?.replace(/"/g, '""')}"`,
                `"${lead.message?.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `TaxFriend_Leads_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredLeads = leads.filter(lead =>
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.service?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={32} />
                        Leads Inbox
                    </h1>
                    <p className="text-slate-500 font-medium">Manage and export your website inquiries</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full md:w-64 lg:w-80 transition-all text-sm font-bold outline-none"
                        />
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95"
                    >
                        <Download size={18} /> Export Excel
                    </button>

                    <button
                        onClick={fetchLeads}
                        className="p-3.5 bg-white border-2 border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <RefreshCw size={40} className="text-blue-600 animate-spin mb-4" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Records...</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date/Time</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Service</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Message</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode='popLayout'>
                                {filteredLeads.map((lead, index) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ delay: index * 0.03 }}
                                        key={lead.id}
                                        className="hover:bg-blue-50/30 transition-all group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{new Date(lead.created_at).toLocaleDateString('en-GB')}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">{lead.name}</span>
                                                <div className="flex flex-col mt-1 space-y-0.5">
                                                    <a href={`mailto:${lead.email}`} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                                                        <Mail size={12} className="text-slate-400" /> {lead.email}
                                                    </a>
                                                    <a href={`tel:${lead.phone}`} className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 transition-colors">
                                                        <Phone size={12} className="text-slate-400" /> {lead.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                {lead.service || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm text-slate-600 font-medium line-clamp-2 italic leading-relaxed" title={lead.message}>
                                                "{lead.message}"
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${lead.name},\n\nI am following up on your inquiry for *${lead.service || 'Tax Services'}* on TaxFriend India.\n\n*Your Inquiry:* ${lead.message}`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-emerald-200"
                                                    title="Reply on WhatsApp"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteClick(lead.id)}
                                                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:shadow-rose-200"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {!loading && filteredLeads.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <MessageSquare size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">No Leads Found</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">
                            Your database is currently empty. New inquiries will appear here automatically.
                        </p>
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
                title="PERMANENT DELETE?"
                message="This inquiry will be removed from the server forever. This action cannot be undone."
                danger={true}
            />
        </div>
    )
}

export default AdminLeads
