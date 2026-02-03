import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Library, Plus, X, Upload as UploadIcon
} from 'lucide-react'
import FolderManager from '../../components/Documents/FolderManager'
import { FolderService } from '../../services/folderService'

/**
 * ClientArchivesTab - Admin view for managing client documents with folder system
 * Now uses the flexible FolderManager component
 */
const ClientArchivesTab = ({ clientId }) => {
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadFiles, setUploadFiles] = useState([])
    const [uploadMetadata, setUploadMetadata] = useState({
        domain: '',
        sub_type: '',
        year_type: 'FY',
        year: new Date().getFullYear().toString(),
        tags: []
    })

    const handleUpload = async () => {
        if (uploadFiles.length === 0) {
            alert('Please select at least one file')
            return
        }

        setUploading(true)
        try {
            const uploadPromises = Array.from(uploadFiles).map(file =>
                FolderService.uploadFile(clientId, selectedFolder, file, uploadMetadata)
            )

            await Promise.all(uploadPromises)

            alert(`Successfully uploaded ${uploadFiles.length} file(s)!`)
            setShowUploadModal(false)
            setUploadFiles([])
            setUploadMetadata({
                domain: '',
                sub_type: '',
                year_type: 'FY',
                year: new Date().getFullYear().toString(),
                tags: []
            })
            // Force refresh by re-rendering FolderManager
            window.location.reload() // Simple refresh for now
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Upload failed: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Library size={20} className="text-indigo-600" />
                    Document Archive
                </h3>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
                >
                    <Plus size={16} /> Upload Document
                </button>
            </div>

            {/* Folder Manager Component */}
            <FolderManager
                userId={clientId}
                onFileSelect={(file) => console.log('Selected file:', file)}
                showUploadButton={false}
            />

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Upload Document</h3>
                                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Folder Selection Info */}
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">
                                        Upload Location
                                    </p>
                                    <p className="text-sm text-indigo-700 font-bold">
                                        {selectedFolder ? '📁 Selected Folder' : '📂 Root Level'}
                                    </p>
                                    <p className="text-xs text-indigo-600 mt-1">
                                        Files will be uploaded to the currently open folder in the file manager.
                                    </p>
                                </div>

                                {/* Optional Metadata */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Optional: Add Metadata for Better Organization
                                    </label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-600 font-bold mb-2 block">Category</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., GST Return"
                                                value={uploadMetadata.domain}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, domain: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 font-bold mb-2 block">Sub-Type</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., GSTR-3B"
                                                value={uploadMetadata.sub_type}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, sub_type: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-600 font-bold mb-2 block">Year Type</label>
                                            <select
                                                value={uploadMetadata.year_type}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, year_type: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="FY">FY</option>
                                                <option value="AY">AY</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 font-bold mb-2 block">Year</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 2024-25"
                                                value={uploadMetadata.year}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, year: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Files</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setUploadFiles(e.target.files)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-300 transition-colors text-center">
                                            <UploadIcon className="text-slate-300 group-hover:text-indigo-600 mb-2" size={32} />
                                            <p className="text-[10px] font-black text-slate-500 group-hover:text-indigo-700 uppercase tracking-widest">
                                                {uploadFiles.length > 0
                                                    ? `${uploadFiles.length} file(s) selected`
                                                    : 'Click or drop files here'}
                                            </p>
                                        </div>
                                    </div>
                                    {uploadFiles.length > 0 && (
                                        <div className="text-xs text-emerald-600 font-bold">
                                            Ready to upload: {Array.from(uploadFiles).map(f => f.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t flex gap-3">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || uploadFiles.length === 0}
                                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Files'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ClientArchivesTab
