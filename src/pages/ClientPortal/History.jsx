import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Download, ChevronDown, ChevronUp, FileText, CheckCircle2, Clock, AlertCircle, Trash2, ArrowRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

// Renamed History (lucide) to avoid name collision
const HistoryIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>
)

const renderIcon = (iconName) => {
    if (!iconName) return '📄'
    const IconComponent = LucideIcons[iconName]
    if (IconComponent) {
        return <IconComponent className="w-5 h-5" />
    }
    return iconName
}

const History = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [openAccordion, setOpenAccordion] = useState(null)
    const [redirectTimer, setRedirectTimer] = useState(null)

    useEffect(() => {
        fetchHistory()
    }, [user])

    // Handle Auto-Redirection from New Request
    useEffect(() => {
        if (location.state?.newRequest) {
            const timer = setTimeout(() => {
                navigate('/dashboard/documents')
            }, 5000)

            setRedirectTimer(5) // Start countdown for UI
            const interval = setInterval(() => {
                setRedirectTimer(prev => prev > 0 ? prev - 1 : 0)
            }, 1000)

            return () => {
                clearTimeout(timer)
                clearInterval(interval)
            }
        }
    }, [location.state, navigate])

    const fetchHistory = async () => {
        try {
            setLoading(true)
            if (!user) return

            // 1. Fetch user services
            const { data: userServices, error: usError } = await supabase
                .from('user_services')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (usError) throw usError

            if (!userServices || userServices.length === 0) {
                setRequests([])
                return
            }

            // 2. Manual Join with Service Catalog
            const serviceIds = [...new Set(userServices.map(s => s.service_id))]
            const { data: catalogData, error: catError } = await supabase
                .from('service_catalog')
                .select('id, title, icon')
                .in('id', serviceIds)

            if (catError) throw catError

            const catalogMap = (catalogData || []).reduce((acc, item) => ({ ...acc, [item.id]: item }), {})

            const detailedServices = userServices.map(svc => ({
                ...svc,
                service: catalogMap[svc.service_id] || { title: 'Unknown Service', icon: '📄' }
            }))

            setRequests(detailedServices)
        } catch (error) {
            console.error('Error fetching history:', error)
            setRequests([])
        } finally {
            setLoading(false)
        }
    }

    // Modal State
    const [cancelModal, setCancelModal] = useState({ isOpen: false, requestId: null })

    const initiateCancel = (id) => {
        setCancelModal({ isOpen: true, requestId: id })
    }

    const confirmCancel = async () => {
        const id = cancelModal.requestId
        if (!id) return

        try {
            const { data, error } = await supabase
                .from('user_services')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) throw new Error('Update failed: Action blocked by security policies.')

            setRequests(prev => prev.map(req =>
                req.id === id ? { ...req, status: 'cancelled' } : req
            ))

            // Close modal
            setCancelModal({ isOpen: false, requestId: null })

        } catch (error) {
            console.error('Error cancelling request:', error)
            alert('Failed to cancel request: ' + (error.message || 'Unknown error'))
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200'
            case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200'
            case 'quality_check': return 'text-purple-600 bg-purple-50 border-purple-200'
            case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
            case 'cancelled': return 'text-gray-500 bg-gray-100 border-gray-200'
            default: return 'text-amber-600 bg-amber-50 border-amber-200'
        }
    }

    const getProgressPercentage = (status) => {
        switch (status) {
            case 'completed': return 100
            case 'quality_check': return 75
            case 'processing': return 50
            case 'cancelled': return 0
            default: return 25
        }
    }

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No History Found</h2>
                <p className="text-gray-500 max-w-sm mb-8">
                    You haven't availed any services yet. Start by browsing our catalog.
                </p>
                <Link
                    to="/dashboard/services"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                    Browse Services
                </Link>
            </div>
        )
    }

    const steps = [
        { label: 'Doc Collection', value: 25 },
        { label: 'Processing', value: 50 },
        { label: 'Quality Check', value: 75 },
        { label: 'Completed', value: 100 },
    ]

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Auto Redirect Info Message */}
            <AnimatePresence>
                {redirectTimer !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <Clock className="w-6 h-6 animate-pulse" />
                            <div>
                                <p className="font-bold text-lg">Request Successful!</p>
                                <p className="text-indigo-100">Redirecting to Document Upload in {redirectTimer} seconds...</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/documents')}
                            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors"
                        >
                            Go Now <ArrowRight size={14} className="inline ml-1" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <h1 className="text-2xl font-bold text-slate-800">Service History</h1>

            <div className="grid grid-cols-1 gap-4">
                {requests.map((req, index) => {
                    const currentProgress = getProgressPercentage(req.status || 'pending')
                    const isExpanded = openAccordion === req.id || (index === 0 && redirectTimer !== null) // Auto expand latest if redirecting

                    return (
                        <div
                            key={req.id}
                            className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-md border-indigo-100 ring-1 ring-indigo-50' : 'shadow-sm border-slate-200 hover:shadow-md'
                                } ${req.status === 'cancelled' ? 'opacity-75 grayscale-[0.5]' : ''}`}
                        >
                            {/* Card Header / Summary */}
                            <div
                                onClick={() => setOpenAccordion(openAccordion === req.id ? null : req.id)}
                                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-2xl border border-slate-100">
                                        {renderIcon(req.service?.icon)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 text-lg">
                                                {req.service?.title}
                                            </h3>
                                            {/* Show Latest badge only if it's the very first item AND not cancelled */}
                                            {index === 0 && req.status !== 'cancelled' && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-md shadow-sm">Latest</span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm flex items-center mt-1">
                                            <span className="font-mono text-xs opacity-70 mr-3">#{req.id.slice(0, 8).toUpperCase()}</span>
                                            <Calendar size={12} className="mr-1" />
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[200px]">
                                    {/* Mini Status Badge */}
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(req.status || 'pending')}`}>
                                        {(req.status || 'pending').replace('_', ' ')}
                                    </div>
                                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {/* Mini Progress Bar (Always Visible unless cancelled) */}
                            {req.status !== 'cancelled' && (
                                <div className="px-5 pb-5">
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div
                                            className={`h-full transition-all duration-1000 ${req.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            style={{ width: `${currentProgress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        {steps.map((step) => (
                                            <div key={step.label} className={`text-[10px] uppercase font-bold tracking-wider ${currentProgress >= step.value ? 'text-slate-700' : 'text-slate-300'}`}>
                                                {step.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-100 bg-slate-50/50"
                                    >
                                        <div className="p-5 space-y-4">
                                            {/* Status Specific Content */}
                                            <div className="w-full">
                                                {/* Completed State */}
                                                {req.status === 'completed' && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-start space-x-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm transition-all hover:shadow-md hover:shadow-emerald-500/5">
                                                            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                                                            <div className="flex-1">
                                                                <p className="font-black text-emerald-900 uppercase tracking-wide text-xs">Service Completed Successfully</p>
                                                                <p className="text-xs mt-1 text-emerald-700 font-medium">
                                                                    {req.comments || "Your request has been processed and verified by our team."}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {req.completed_file_url ? (
                                                            <div className="flex flex-col sm:flex-row gap-3">
                                                                <a
                                                                    href={req.completed_file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 text-sm font-black uppercase tracking-widest"
                                                                >
                                                                    <Download size={18} />
                                                                    <span>Download Work Copy</span>
                                                                </a>
                                                                <button className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest">
                                                                    Report Issue
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-black text-slate-800 tracking-tight">Digital Copy Not Yet Linked</p>
                                                                    <p className="text-xs text-slate-500 font-medium mt-1">Please reach out to our support channel to collect your final service documents.</p>
                                                                </div>
                                                                <div className="flex gap-2 w-full md:w-auto">
                                                                    <a href="https://wa.me/919420720491" target="_blank" className="flex-1 md:flex-none px-4 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all text-center">
                                                                        WhatsApp
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Rejected State */}
                                                {req.status === 'rejected' && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm transition-all hover:shadow-md hover:shadow-rose-500/5">
                                                            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
                                                            <div className="flex-1">
                                                                <p className="font-black text-rose-900 uppercase tracking-wide text-xs">Service Request Rejected</p>
                                                                <p className="text-xs mt-1 text-rose-700 font-medium">
                                                                    {req.comments ? (
                                                                        <span>
                                                                            <span className="font-bold underline">Reason:</span> {req.comments}.
                                                                            <span className="block mt-2 text-[10px] opacity-80 italic">For more information contact our team or email us at taxfriend.tax@gmail.com</span>
                                                                        </span>
                                                                    ) : (
                                                                        "Your request could not be processed at this time. Please contact support for more details."
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a href="https://wa.me/919420720491" target="_blank" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all text-center">
                                                                Contact Support
                                                            </a>
                                                            <button
                                                                onClick={() => navigate('/dashboard/services')}
                                                                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                                            >
                                                                Try Again
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Generic Comments (if not completed/rejected but has notes) */}
                                                {(req.comments && req.status !== 'completed' && req.status !== 'rejected') && (
                                                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Admin Notes</p>
                                                        <p className="text-sm text-slate-600 italic">"{req.comments}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                                <div className="text-xs text-slate-400">
                                                    Last Update: {new Date(req.updated_at || req.created_at).toLocaleString()}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {/* Cancel Request Button (Only for Pending) */}
                                                    {req.status === 'pending' && (
                                                        <button
                                                            onClick={() => initiateCancel(req.id)}
                                                            className="flex items-center space-x-2 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm text-sm font-medium"
                                                        >
                                                            <Trash2 size={16} />
                                                            <span>Cancel Request</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>

            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
                {cancelModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Service Request?</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    Are you sure you want to cancel this request? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setCancelModal({ isOpen: false, requestId: null })}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={confirmCancel}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                                    >
                                        Yes, Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default History
