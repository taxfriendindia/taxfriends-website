import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Folder, FolderPlus, Upload, FileText, Eye, Trash2,
    Edit2, X, Search, ChevronRight, ArrowLeft, MoreVertical, Download
} from 'lucide-react'
import { FolderService } from '../../services/folderService'
import { downloadFolderAsZip } from '../../utils/zipDownloader'

/**
 * Simple Windows-style File Manager
 * Just folders, files, and basic operations - no complicated forms
 */
const SimpleFileManager = ({ userId, readOnly = false }) => {
    const [folders, setFolders] = useState([])
    const [files, setFiles] = useState([])
    const [currentFolderId, setCurrentFolderId] = useState(null)
    const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: 'My Documents' }])
    const [loading, setLoading] = useState(true)

    // Modals
    const [showNewFolder, setShowNewFolder] = useState(false)
    const [showUploadFiles, setShowUploadFiles] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [selectedFiles, setSelectedFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [isZipping, setIsZipping] = useState(false)

    useEffect(() => {
        if (userId) loadCurrentFolder()
    }, [userId, currentFolderId])

    const loadCurrentFolder = async () => {
        try {
            setLoading(true)
            const [foldersData, filesData] = await Promise.all([
                FolderService.getUserFolders(userId, currentFolderId),
                FolderService.getFilesInFolder(currentFolderId, userId)
            ])
            setFolders(foldersData)
            setFiles(filesData)

            if (currentFolderId) {
                const path = await FolderService.getFolderPath(currentFolderId)
                setBreadcrumb(path)
            } else {
                setBreadcrumb([{ id: null, name: 'My Documents' }])
            }
        } catch (error) {
            console.error('Error loading folder:', error)
        } finally {
            setLoading(false)
        }
    }

    const createFolder = async () => {
        if (!newFolderName.trim()) return
        try {
            await FolderService.createFolder(userId, newFolderName.trim(), currentFolderId)
            setNewFolderName('')
            setShowNewFolder(false)
            loadCurrentFolder()
        } catch (error) {
            alert(error.message || 'Failed to create folder')
        }
    }

    const uploadFiles = async () => {
        if (selectedFiles.length === 0) return

        setUploading(true)
        try {
            for (const file of selectedFiles) {
                await FolderService.uploadFile(userId, currentFolderId, file, {})
            }
            alert(`Uploaded ${selectedFiles.length} file(s) successfully!`)
            setSelectedFiles([])
            setShowUploadFiles(false)
            loadCurrentFolder()
        } catch (error) {
            alert('Upload failed: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const openFolder = (folderId) => {
        setCurrentFolderId(folderId)
    }

    const goBack = () => {
        if (breadcrumb.length > 1) {
            const parent = breadcrumb[breadcrumb.length - 2]
            setCurrentFolderId(parent.id)
        }
    }

    const handleFileClick = async (file) => {
        try {
            const signedUrl = await FolderService.getSignedUrl(file.file_url)
            // Open in a centered popup window
            const width = 1000
            const height = 800
            const left = (window.screen.width - width) / 2
            const top = (window.screen.height - height) / 2

            window.open(
                signedUrl,
                'FileViewer',
                `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
            )
        } catch (err) {
            alert('Could not open file: ' + err.message)
        }
    }

    const handleZipDownload = async () => {
        setIsZipping(true)
        try {
            const name = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 1].name : 'My_Documents'
            await downloadFolderAsZip(userId, currentFolderId, name)
        } catch (error) {
            alert('Failed to download zip: ' + error.message)
        } finally {
            setIsZipping(false)
        }
    }

    const deleteFolder = async (folderId) => {
        if (!confirm('Delete this folder and all its contents?')) return
        try {
            await FolderService.deleteFolder(folderId, true)
            loadCurrentFolder()
        } catch (error) {
            alert('Delete failed: ' + error.message)
        }
    }

    const handleDownload = async (file) => {
        try {
            const signedUrl = await FolderService.getSignedUrl(file.file_url, { download: file.file_name })

            // Create a temporary link to trigger download
            const link = document.createElement('a')
            link.href = signedUrl
            link.setAttribute('download', file.file_name)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            alert('Could not download file: ' + err.message)
        }
    }

    const deleteFile = async (fileId, fileUrl) => {
        if (!confirm('Delete this file permanently?')) return
        try {
            await FolderService.deleteFile(fileId, fileUrl)
            loadCurrentFolder()
        } catch (error) {
            alert('Delete failed: ' + error.message)
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {currentFolderId && (
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            title="Go back"
                        >
                            <ArrowLeft size={18} className="text-slate-600" />
                        </button>
                    )}
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1">
                        {breadcrumb.map((crumb, idx) => (
                            <React.Fragment key={crumb.id || 'root'}>
                                {idx > 0 && <ChevronRight size={14} className="text-slate-300" />}
                                <button
                                    onClick={() => setCurrentFolderId(crumb.id)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${idx === breadcrumb.length - 1
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {crumb.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZipDownload}
                        disabled={isZipping || loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200"
                    >
                        {isZipping ? (
                            <>Loading...</>
                        ) : (
                            <>
                                <Download size={14} /> Download Zip
                            </>
                        )}
                    </button>
                    {!readOnly && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowNewFolder(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all"
                            >
                                <FolderPlus size={16} /> New Folder
                            </button>
                            <button
                                onClick={() => setShowUploadFiles(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                            >
                                <Upload size={16} /> Upload Files
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* File/Folder List */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-sm text-slate-400 font-medium">Loading...</p>
                    </div>
                ) : folders.length === 0 && files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Folder className="w-16 h-16 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium">This folder is empty</p>
                        <p className="text-sm text-slate-400 mt-1">Create a folder or upload files to get started</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Folders First */}
                        {folders.map((folder) => (
                            <div
                                key={folder.id}
                                className="group flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"
                                onClick={() => openFolder(folder.id)}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: folder.color + '15', color: folder.color }}
                                >
                                    <Folder size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-800 truncate">{folder.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(folder.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {!readOnly && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Then Files */}
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="group flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                                onClick={() => handleFileClick(file)}
                            >
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                        {file.file_name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {file.file_size ? (file.file_size / 1024).toFixed(1) + ' KB' : 'Unknown size'} • {new Date(file.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation()
                                            handleDownload(file)
                                        }}
                                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                    {!readOnly && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteFile(file.id, file.file_url); }}
                                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                            title="Delete File"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Folder Modal */}
            <AnimatePresence>
                {showNewFolder && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl w-full max-w-md shadow-2xl"
                        >
                            <div className="p-5 border-b flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">New Folder</h3>
                                <button onClick={() => setShowNewFolder(false)} className="p-1 hover:bg-slate-100 rounded">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-5">
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                                    placeholder="Folder name"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="p-5 border-t flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowNewFolder(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createFolder}
                                    disabled={!newFolderName.trim()}
                                    className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                                >
                                    Create
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Upload Files Modal */}
            <AnimatePresence>
                {showUploadFiles && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl w-full max-w-md shadow-2xl"
                        >
                            <div className="p-5 border-b flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Upload Files</h3>
                                <button onClick={() => setShowUploadFiles(false)} className="p-1 hover:bg-slate-100 rounded">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <p className="text-sm font-bold text-indigo-900">
                                        {breadcrumb[breadcrumb.length - 1].name}
                                    </p>
                                    <p className="text-xs text-indigo-600 mt-1">Files will be uploaded here</p>
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                                        <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-slate-600">
                                            {selectedFiles.length > 0
                                                ? `${selectedFiles.length} file(s) selected`
                                                : 'Click to select files or drag here'}
                                        </p>
                                    </div>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                                                <FileText size={14} className="text-slate-400" />
                                                <span className="flex-1 truncate">{file.name}</span>
                                                <span className="text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowUploadFiles(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={uploadFiles}
                                    disabled={uploading || selectedFiles.length === 0}
                                    className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                                >
                                    {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} File${selectedFiles.length !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default SimpleFileManager
