import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, X, AlertCircle, Loader2, Trash2, Mail, ExternalLink, Briefcase } from 'lucide-react'
import { DocumentService } from '../../services/documentService'
import { RequestService } from '../../services/requestService'
import { UserService } from '../../services/userService'
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

    const ADMIN_EMAIL = 'support@apnataxfriend.com'

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        try {
            const docs = await DocumentService.getUserDocuments(user.id)
            setDocuments(docs)

            const services = await RequestService.getLatestForUser(user.id)

            if (services && services.length > 0) {
                setLatestService(services[0])
            }

            const profile = await UserService.getProfile(user.id)
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
        // Restriction: Only 200KB Allowed
        const MAX_SIZE = 200 * 1024 // 200KB
        const validFiles = []
        const skippedFiles = []

        files.forEach(file => {
            if (file.size <= MAX_SIZE) {
                validFiles.push(file)
            } else {
                skippedFiles.push(file.name)
            }
        })

        if (skippedFiles.length > 0) {
            setMessage({
                type: 'error',
                text: `Files must be < 200KB. Skipped: ${skippedFiles.join(', ')}`
            })
        }

        setSelectedFiles(prev => [...prev, ...validFiles])

        if (validFiles.length > 0 && skippedFiles.length === 0) {
            setMessage(null)
        }
    }

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one document.' })
            return
        }

        setSending(true)
        setMessage(null)

        try {
            // Sequential upload to avoid overwhelming network/UI
            let successCount = 0
            for (const file of selectedFiles) {
                await DocumentService.uploadFile(user.id, file, userProfile || {})
                successCount++
            }

            await UserService.createNotification(
                user.id,
                'Documents Uploaded',
                `You uploaded ${successCount} document(s) securely.`,
                'success'
            )

            setMessage({
                type: 'success',
                text: `Successfully uploaded ${successCount} documents to secure storage!`
            })

            setSelectedFiles([])
            fetchData() // Refresh list

        } catch (error) {
            console.error('Error uploading:', error)
            setMessage({ type: 'error', text: 'Upload failed: ' + (error.message || 'Server Error. Try 1 file at a time.') })
        } finally {
            setSending(false)
        }
    }

    const handleWhatsApp = () => {
        const serviceName = latestService?.service?.title
        const text = serviceName
            ? `Hello Apna TaxFriend, I want to share documents for my service request: "${serviceName}". Please guide me on WhatsApp upload.`
            : "Hello Apna TaxFriend, I want to share documents for my service request. Please guide me on WhatsApp upload."

        const message = encodeURIComponent(text)
        window.open(`https://wa.me/918409847102?text=${message}`, '_blank')
    }

    const handleDelete = async (id) => {
        // User cannot delete (as per 'safe from accidental deletion' request)
        // Or if they uploaded wrongly? Maybe allow DELETE provided status is 'pending'?
        // The SQL policy blocks user deletes. So we should show error or hide button.
        // But for UX, let's try, and if it fails, tell them only Admin can delete.
        if (!confirm('Request to remove this document?')) return
        try {
            await DocumentService.deleteDocument(id)
            setDocuments(prev => prev.filter(d => d.id !== id))
        } catch (error) {
            console.error(error)
            alert("Only Admins can delete documents once uploaded for security.")
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
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Upload Documents</h3>
                    <p className="text-sm text-gray-500">
                        Please upload your <span className="font-bold text-gray-700 dark:text-gray-300">Adhar Card</span>, <span className="font-bold text-gray-700 dark:text-gray-300">PAN Card</span>, or Business Docs.
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
                        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Upload className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                Drag & Drop Documents Here
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Max 200KB per file.
                            </p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm"
                        >
                            Select Documents
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
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ready to Upload ({selectedFiles.length})</h4>
                        <div className="space-y-2">
                            {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <FileText size={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
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
                            <p className="font-semibold">Security Note:</p>
                            <p>Once uploaded, documents can only be removed by an Admin. Please ensure you upload the correct files.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || sending}
                            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-2"
                        >
                            {sending ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                            <span>{sending ? 'Uploading...' : 'Upload Securely'}</span>
                        </button>

                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center space-x-2"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            <span>Share on WhatsApp</span>
                        </button>
                    </div>

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
                                    {doc.file_url && doc.file_url.startsWith('http') ? (
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 text-sm hover:underline"
                                        >
                                            View
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No Preview</span>
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
