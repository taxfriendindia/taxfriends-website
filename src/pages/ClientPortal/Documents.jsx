import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, X, AlertCircle, Loader2, Trash2, Mail, ExternalLink, Briefcase } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const Documents = () => {
    const { user } = useAuth()
    const fileInputRef = useRef(null)
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [message, setMessage] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [latestService, setLatestService] = useState(null)
    const [userProfile, setUserProfile] = useState(null)

    const ADMIN_EMAIL = 'support@taxfriends.com'

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: docs } = await supabase
                .from('user_documents')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            setDocuments(docs || [])

            const { data: services } = await supabase
                .from('user_services')
                .select('*, service:service_catalog(title)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            if (services && services.length > 0) {
                setLatestService(services[0])
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            setUserProfile(profile)

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files) {
            handleFileSelection(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileSelection = (files) => {
        const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024)
        if (validFiles.length !== files.length) {
            setMessage({ type: 'error', text: 'Some files were too large (>10MB) and skipped.' })
        }
        setSelectedFiles(prev => [...prev, ...validFiles])
        setMessage(null)
    }

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSendEmail = async () => {
        if (selectedFiles.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one document.' })
            return
        }

        setSending(true)
        try {
            const serviceName = latestService?.service?.title || 'General Service'
            const userName = userProfile?.full_name || user.email
            const userPhone = userProfile?.phone || 'Not provided'

            const fileListParams = selectedFiles.map((f, i) => `${i + 1}. ${f.name}`).join('\n')

            const subject = encodeURIComponent(`Documents for ${serviceName} - ${userName}`)
            const body = encodeURIComponent(
                `Hello TaxFriends Team,

I am submitting documents for my service request: ${serviceName}.

--- Client Details ---
Name: ${userName}
Email: ${user.email}
Phone: ${userPhone}
----------------------

Files Attached manually to this email:
${fileListParams}

Additional Comments:
(Please write here)

Regards,
${userName}`
            )

            window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_self')

            const timestamp = new Date().toISOString()
            const insertPromises = selectedFiles.map(file =>
                supabase.from('user_documents').insert({
                    user_id: user.id,
                    name: file.name,
                    doc_type: file.type || 'email_attachment',
                    file_url: 'sent_via_email',
                    status: 'pending',
                    created_at: timestamp
                })
            )

            await Promise.all(insertPromises)

            await supabase.from('notifications').insert([{
                user_id: user.id,
                title: 'Documents Sent',
                message: `You sent ${selectedFiles.length} document(s) via email for ${serviceName}.`,
                type: 'success'
            }])

            setMessage({
                type: 'success',
                text: 'Email draft opened! Please attach your files and send properly.'
            })

            setSelectedFiles([])
            fetchData()

        } catch (error) {
            console.error('Error logging documents:', error)
            setMessage({ type: 'error', text: 'Failed to update records: ' + error.message })
        } finally {
            setSending(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Remove this document record?')) return
        try {
            await supabase.from('user_documents').delete().eq('id', id)
            setDocuments(prev => prev.filter(d => d.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Documents</h2>

            {latestService && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center text-blue-800 dark:text-blue-300">
                    <Briefcase className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="text-sm">
                        Uploading documents for your recent request: <strong>{latestService.service?.title}</strong>
                    </span>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Send Documents via Email</h3>
                    <p className="text-sm text-gray-500">
                        To save storage, we use email for document submission. Select your files below.
                    </p>
                </div>

                <div
                    className={`p-8 text-center transition-all border-b border-gray-100 dark:border-gray-700 ${dragActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50/50 dark:bg-gray-800'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Upload className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                Drag & Drop files here
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PDF, Images, Excel (Max 10MB)
                            </p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm"
                        >
                            Select Files
                        </button>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelection(Array.from(e.target.files))}
                    multiple
                />

                {selectedFiles.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ready to Send ({selectedFiles.length})</h4>
                        <div className="space-y-2">
                            {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <FileText size={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <button onClick={() => removeSelectedFile(idx)} className="text-gray-400 hover:text-red-500">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-6 bg-white dark:bg-gray-800">
                    <div className="flex items-start gap-3 bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Important:</p>
                            <p>Clicking "Compose Email" will open your default email app.</p>
                            <p className="mt-1">Please <span className="font-bold underline">manually attach</span> the selected files to the email before sending.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSendEmail}
                        disabled={selectedFiles.length === 0 || sending}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-2"
                    >
                        {sending ? <Loader2 className="animate-spin" /> : <Mail size={20} />}
                        <span>{sending ? 'Opening Email...' : 'Compose Email & Mark as Sent'}</span>
                        {!sending && <ExternalLink size={16} opacity={0.7} />}
                    </button>
                    {message && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`mt-4 text-center text-sm font-medium ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
                        >
                            {message.text}
                        </motion.p>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Document History</h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600 border border-dashed rounded-xl border-gray-300 dark:border-gray-700">
                        <p>No documents recorded.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {documents.map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                                            <div className="flex items-center text-xs text-gray-500 space-x-2">
                                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {doc.file_url === 'sent_via_email' ? (
                                        <span className="text-xs text-gray-400 italic">Sent via Email</span>
                                    ) : (
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 text-sm hover:underline"
                                        >
                                            View
                                        </a>
                                    )}
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Documents
