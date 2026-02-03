import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Folder, FolderOpen, File, ChevronRight, ChevronDown,
    Plus, Edit2, Trash2, Move, X, Check, Search, ArrowLeft,
    MoreVertical, Download, Eye, Tag as TagIcon
} from 'lucide-react'
import { FolderService } from '../../services/folderService'

/**
 * FolderManager - Reusable component for managing folders and files
 * Provides folder tree navigation, file management, and drag-and-drop
 */
const FolderManager = ({ userId, onFileSelect, showUploadButton = true }) => {
    const [folders, setFolders] = useState([])
    const [files, setFiles] = useState([])
    const [currentFolderId, setCurrentFolderId] = useState(null)
    const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: 'Root' }])
    const [expandedFolders, setExpandedFolders] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Modals
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [showRenameModal, setShowRenameModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [newName, setNewName] = useState('')

    useEffect(() => {
        if (userId) {
            fetchFoldersAndFiles()
        }
    }, [userId, currentFolderId])

    const fetchFoldersAndFiles = async () => {
        try {
            setLoading(true)
            const [foldersData, filesData] = await Promise.all([
                FolderService.getUserFolders(userId, currentFolderId),
                FolderService.getFilesInFolder(currentFolderId, userId)
            ])
            setFolders(foldersData)
            setFiles(filesData)

            // Update breadcrumb
            if (currentFolderId) {
                const path = await FolderService.getFolderPath(currentFolderId)
                setBreadcrumb(path)
            } else {
                setBreadcrumb([{ id: null, name: 'Root' }])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateFolder = async (name, color = '#4F46E5') => {
        try {
            await FolderService.createFolder(userId, name, currentFolderId, color)
            setShowCreateFolder(false)
            fetchFoldersAndFiles()
        } catch (error) {
            alert(error.message || 'Failed to create folder')
        }
    }

    const handleRenameFolder = async (folderId, newName) => {
        try {
            await FolderService.renameFolder(folderId, newName)
            setShowRenameModal(false)
            setEditingItem(null)
            fetchFoldersAndFiles()
        } catch (error) {
            alert(error.message || 'Failed to rename folder')
        }
    }

    const handleRenameFile = async (fileId, newName) => {
        try {
            await FolderService.renameFile(fileId, newName)
            setShowRenameModal(false)
            setEditingItem(null)
            fetchFoldersAndFiles()
        } catch (error) {
            alert(error.message || 'Failed to rename file')
        }
    }

    const handleDeleteFolder = async (folderId) => {
        if (!confirm('Delete this folder and all its contents?')) return
        try {
            await FolderService.deleteFolder(folderId, true)
            fetchFoldersAndFiles()
        } catch (error) {
            alert(error.message || 'Failed to delete folder')
        }
    }

    const handleDeleteFile = async (fileId, fileUrl) => {
        if (!confirm('Delete this file permanently?')) return
        try {
            await FolderService.deleteFile(fileId, fileUrl)
            fetchFoldersAndFiles()
        } catch (error) {
            alert(error.message || 'Failed to delete file')
        }
    }

    const handleFolderClick = (folderId) => {
        setCurrentFolderId(folderId)
    }

    const handleBreadcrumbClick = (folderId) => {
        setCurrentFolderId(folderId)
    }

    const toggleFolderExpansion = (folderId) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId)
        } else {
            newExpanded.add(folderId)
        }
        setExpandedFolders(newExpanded)
    }

    const openRenameModal = (item, type) => {
        setEditingItem({ ...item, type })
        setNewName(item.name || item.file_name)
        setShowRenameModal(true)
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchFoldersAndFiles()
            return
        }
        try {
            const results = await FolderService.searchFiles(userId, searchQuery)
            setFiles(results)
            setFolders([]) // Hide folders during search
        } catch (error) {
            alert('Search failed: ' + error.message)
        }
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
                {searchQuery && (
                    <button
                        onClick={() => { setSearchQuery(''); fetchFoldersAndFiles(); }}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                    {breadcrumb.map((crumb, idx) => (
                        <React.Fragment key={crumb.id || 'root'}>
                            {idx > 0 && <ChevronRight size={14} className="text-slate-300" />}
                            <button
                                onClick={() => handleBreadcrumbClick(crumb.id)}
                                className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${idx === breadcrumb.length - 1
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
                                    }`}
                            >
                                {crumb.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
                <button
                    onClick={() => setShowCreateFolder(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                    <Plus size={14} /> New Folder
                </button>
            </div>

            {/* Folder and File List */}
            {loading ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading...</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {folders.length === 0 && files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Folder className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="text-slate-400 font-bold">
                                {searchQuery ? 'No results found' : 'This folder is empty'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Folders */}
                            <AnimatePresence mode="popLayout">
                                {folders.map((folder) => (
                                    <FolderItem
                                        key={folder.id}
                                        folder={folder}
                                        onOpen={() => handleFolderClick(folder.id)}
                                        onRename={() => openRenameModal(folder, 'folder')}
                                        onDelete={() => handleDeleteFolder(folder.id)}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* Files */}
                            <AnimatePresence mode="popLayout">
                                {files.map((file) => (
                                    <FileItem
                                        key={file.id}
                                        file={file}
                                        onRename={() => openRenameModal(file, 'file')}
                                        onDelete={() => handleDeleteFile(file.id, file.file_url)}
                                        onSelect={onFileSelect}
                                    />
                                ))}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            )}

            {/* Create Folder Modal */}
            <AnimatePresence>
                {showCreateFolder && (
                    <CreateFolderModal
                        onClose={() => setShowCreateFolder(false)}
                        onCreate={handleCreateFolder}
                    />
                )}
            </AnimatePresence>

            {/* Rename Modal */}
            <AnimatePresence>
                {showRenameModal && editingItem && (
                    <RenameModal
                        item={editingItem}
                        newName={newName}
                        setNewName={setNewName}
                        onClose={() => { setShowRenameModal(false); setEditingItem(null); }}
                        onRename={() => {
                            if (editingItem.type === 'folder') {
                                handleRenameFolder(editingItem.id, newName)
                            } else {
                                handleRenameFile(editingItem.id, newName)
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

// Folder Item Component
const FolderItem = ({ folder, onOpen, onRename, onDelete }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all flex items-center gap-4 cursor-pointer"
            onClick={onOpen}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                style={{ backgroundColor: folder.color + '20', color: folder.color }}
            >
                <Folder size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-black text-sm text-slate-800 uppercase tracking-wide truncate">
                    {folder.name}
                </h4>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                    {new Date(folder.created_at).toLocaleDateString()}
                </p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onRename(); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                    <Trash2 size={16} />
                </button>
                <ChevronRight size={18} className="text-slate-300" />
            </div>
        </motion.div>
    )
}

// File Item Component
const FileItem = ({ file, onRename, onDelete, onSelect }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex items-center gap-4"
        >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <File size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-800 truncate">{file.file_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 font-medium">
                        {new Date(file.created_at).toLocaleDateString()}
                    </span>
                    {file.file_size && (
                        <span className="text-xs text-slate-400">
                            • {(file.file_size / 1024).toFixed(1)} KB
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                    <Eye size={16} />
                </a>
                <button
                    onClick={(e) => { e.stopPropagation(); onRename(); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    )
}

// Create Folder Modal
const CreateFolderModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('')
    const [color, setColor] = useState('#4F46E5')

    const colors = [
        '#4F46E5', // Indigo
        '#10B981', // Green
        '#3B82F6', // Blue
        '#F59E0B', // Amber
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#EF4444', // Red
        '#6B7280'  // Gray
    ]

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Create New Folder</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Tax Documents 2024"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Folder Color
                        </label>
                        <div className="flex gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-10 h-10 rounded-lg transition-all ${color === c ? 'ring-4 ring-offset-2' : 'hover:scale-110'
                                        }`}
                                    style={{ backgroundColor: c, ringColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => name.trim() && onCreate(name, color)}
                        disabled={!name.trim()}
                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                        Create Folder
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// Rename Modal
const RenameModal = ({ item, newName, setNewName, onClose, onRename }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
                        Rename {item.type === 'folder' ? 'Folder' : 'File'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                    />
                </div>
                <div className="p-6 bg-slate-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onRename}
                        disabled={!newName.trim()}
                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                        Rename
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default FolderManager
