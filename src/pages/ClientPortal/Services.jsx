import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowRight, CheckCircle, X, AlertCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { CatalogService } from '../../services/catalogService'
import { RequestService } from '../../services/requestService'
import { UserService } from '../../services/userService'
import { DocumentService } from '../../services/documentService'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const renderIcon = (iconName) => {
    if (!iconName) return '📄'

    // If it's a known Lucide icon name
    const IconComponent = LucideIcons[iconName]
    if (IconComponent) {
        return <IconComponent className="w-6 h-6" />
    }

    // Otherwise assume it's an emoji or plain text
    return iconName
}

const Services = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedService, setSelectedService] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [agreed, setAgreed] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const data = await CatalogService.getAll()
            setServices(data)
        } catch (error) {
            console.error('Error fetching services:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRequestService = (service) => {
        setSelectedService(service)
        setIsModalOpen(true)
        setMessage(null)
        setAgreed(false)
    }

    const submitRequest = async () => {
        if (!agreed) {
            setMessage({ type: 'error', text: 'Please agree to the terms.' })
            return
        }

        setSubmitting(true)
        try {
            // Check for duplicate pending/processing requests
            const existing = await RequestService.checkActiveRequest(user.id, selectedService.id)

            if (existing) {
                throw new Error(`You already have a active request (${existing.status}) for this service.`)
            }

            await RequestService.createRequest(user.id, selectedService.id)

            // Create a notification
            await UserService.createNotification(
                user.id,
                `Service Requested - ${selectedService.title}`,
                `Request received for ${selectedService.title}. Please upload relevant documents in the Documents section. Our team will verify them and reach back to you soon.`,
                'info'
            )

            setMessage({ type: 'success', text: 'Request submitted successfully! Redirecting...' })

            // Check if user has previously uploaded documents
            // If they have docs, we don't force them to the upload page.
            const userDocs = await DocumentService.getUserDocuments(user.id)
            const hasDocs = userDocs && userDocs.length > 0

            setTimeout(() => {
                setIsModalOpen(false)
                setSelectedService(null)

                if (hasDocs) {
                    // User knows the drill / has docs. Just go to history.
                    navigate('/dashboard/history')
                } else {
                    // New user or no docs. Nudge them to upload.
                    navigate('/dashboard/history', { state: { newRequest: true } })
                }
            }, 1000)

        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to submit request.' })
        } finally {
            setSubmitting(false)
        }
    }

    const filteredServices = services.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="max-w-6xl mx-auto pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Service Catalog</h2>
                    <p className="text-gray-500 mt-1">Select a service to get started.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={service.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden group"
                        >
                            {['GST Return Filing', 'Company Incorporation', 'Income Tax Filing', 'Income Tax Return'].includes(service.title) && (
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[10px] uppercase font-black px-3 py-1.5 rounded-bl-xl shadow-lg z-10 tracking-widest">
                                    Popular
                                </div>
                            )}
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                {renderIcon(service.icon)}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{service.title}</h3>
                            <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">{service.description}</p>

                            <button
                                onClick={() => handleRequestService(service)}
                                className="w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-700/50 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-200"
                            >
                                <span>Request Service</span>
                                <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500">No services found matching your search.</p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && selectedService && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl">
                                        {renderIcon(selectedService.icon)}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Request</h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    You are requesting <span className="font-bold text-gray-900 dark:text-white">{selectedService.title}</span>.
                                    Our team will review your request and get back to you shortly.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl">
                                        <input
                                            type="checkbox"
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            I agree to the Terms & Conditions and understand that this service request is subject to approval given sufficient documentation.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-3">
                                {message && (
                                    <div className={`p-3 rounded-lg text-sm flex items-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {message.type === 'error' ? <AlertCircle size={16} className="mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                                        {message.text}
                                    </div>
                                )}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitRequest}
                                        disabled={submitting}
                                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                    >
                                        {submitting ? 'Processing...' : 'Confirm Request'}
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

export default Services
