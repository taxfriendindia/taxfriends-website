import React, { useState, useCallback } from 'react'
import { Upload, X, FileText, CheckCircle, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderService } from '../../services/folderService'
import { useAuth } from '../../contexts/AuthContext'

const ServiceDocumentUploader = ({ serviceName, onUploadComplete }) => {
    const { user } = useAuth()
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }, [])

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        setUploading(true)
        setProgress(0)
        try {
            // Upload to root folder (null)
            const total = files.length
            let completed = 0

            for (const file of files) {
                await FolderService.uploadFile(user.id, null, file, {
                    description: serviceName ? `For Service: ${serviceName}` : 'Client Upload'
                })
                completed++
                setProgress((completed / total) * 100)
            }

            // Success feedback
            setFiles([])
            setUploading(false)
            if (onUploadComplete) onUploadComplete()

            // Optional: Trigger global refresh or alert
            alert('Documents uploaded successfully!')
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Upload failed: ' + error.message)
            setUploading(false)
        }
    }

    const handleWhatsAppShare = () => {
        // Replace with your actual admin number
        const adminNumber = '918409847102'
        const text = `Hello TaxFriend, I have uploaded documents for ${serviceName || 'my service request'}. Please check.`
        window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`, '_blank')
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
                {serviceName ? `Upload Documents for ${serviceName}` : 'Upload Supporting Documents'}
            </h2>
            <p className="text-slate-500 mb-6">
                Drag & drop your files here or browse to upload.
            </p>

            {/* Dropzone */}
            <div
                className="border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 p-10 text-center transition-all hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer relative"
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="text-lg font-bold text-indigo-900">Click to Browse or Drag Files Here</p>
                    <p className="text-sm text-indigo-600/70 mt-1">Supports PDF, JPG, PNG, Excel</p>
                </div>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 space-y-3"
                    >
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText size={20} className="text-slate-400 flex-shrink-0" />
                                    <span className="font-medium text-slate-700 truncate text-sm">{file.name}</span>
                                    <span className="text-xs text-slate-400 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button
                                    onClick={() => removeFile(idx)}
                                    className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
                <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    className="flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 transition-all"
                >
                    {uploading ? (
                        <>Uploading {progress.toFixed(0)}%...</>
                    ) : (
                        <>
                            <Upload size={20} />
                            Upload to Server
                        </>
                    )}
                </button>

                <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
                >
                    <Smartphone size={20} />
                    Share on WhatsApp
                </button>
            </div>
        </div>
    )
}

export default ServiceDocumentUploader
