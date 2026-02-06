import React, { useState, useEffect } from 'react'
import { DocumentService } from '../../services/DocumentService'
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ClientDocumentManager = ({ userId, serviceName = '' }) => {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (userId) loadDocuments()
    }, [userId])

    const loadDocuments = async () => {
        try {
            setLoading(true)
            const data = await DocumentService.getUserDocuments(userId)
            setDocuments(data)
        } catch (error) {
            console.error('Error loading documents:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const files = Array.from(e.target.files)

        try {
            for (const file of files) {
                // Pass serviceName as description
                await DocumentService.uploadDocument(userId, file, serviceName)
            }
            // Add a small delay for UX
            setTimeout(() => {
                loadDocuments()
                setUploading(false)
            }, 500)
        } catch (error) {
            alert('Upload failed: ' + error.message)
            setUploading(false)
        }
    }

    const handleDelete = async (docId, fileUrl) => {
        if (!confirm('Are you sure you want to delete this document?')) return
        try {
            await DocumentService.deleteDocument(docId, fileUrl)
            loadDocuments()
        } catch (error) {
            alert('Delete failed: ' + error.message)
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Verified</span>
            case 'rejected':
                return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Rejected</span>
            default:
                return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Pending</span>
        }
    }

    return (
        <div className="space-y-8">
            {/* Upload Zone */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {serviceName ? `Upload Documents for ${serviceName}` : 'Upload Supporting Documents'}
                    </h3>
                    <p className="text-slate-500 mb-8">
                        Upload PAN, Aadhaar, Bank Statements, or other documents requested by your tax expert.
                    </p>

                    <div className="relative group cursor-pointer">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={uploading}
                        />
                        <div className={`border-2 border-dashed border-indigo-200 rounded-xl p-8 transition-all group-hover:bg-indigo-50 group-hover:border-indigo-400 ${uploading ? 'opacity-50' : ''}`}>
                            <p className="font-bold text-indigo-700">
                                {uploading ? 'Uploading...' : 'Click to Upload or Drag Files Here'}
                            </p>
                            <p className="text-xs text-indigo-400 mt-2">PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Your Uploaded Documents</h3>
                    <span className="text-sm text-slate-500">{documents.length} files</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading...</div>
                ) : documents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        No documents uploaded yet.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{doc.file_name}</h4>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className="text-xs text-slate-500">
                                                {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                                            </span>
                                            {doc.description && (
                                                <span className="text-xs text-indigo-600 font-medium">
                                                    {doc.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(doc.status)}
                                </div>

                                {doc.admin_feedback && (
                                    <div className="flex-1 bg-amber-50 p-3 rounded-lg text-xs text-amber-800 flex items-start gap-2 border border-amber-100">
                                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                        <span>
                                            <span className="font-bold">Admin Feedback:</span> {doc.admin_feedback}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <button
                                        onClick={() => handleDelete(doc.id, doc.file_url)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Document"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ClientDocumentManager
