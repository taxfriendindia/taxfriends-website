import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Folder, Plus, Trash2, Download, Eye, X,
    Upload, Calendar, Tag, Layers, CheckCircle2,
    FileText, Search, ChevronRight, ChevronLeft, Library
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ClientArchivesTab = ({ clientId }) => {
    const [archives, setArchives] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentFolder, setCurrentFolder] = useState(null) // null = root, 'GST Return' = inside GST
    const [selectedDoc, setSelectedDoc] = useState(null)

    // Form State for Upload
    const [form, setForm] = useState({
        domain: 'GST Return',
        services: [],
        subType: '',
        yearType: 'FY',
        year: new Date().getFullYear().toString(),
        files: []
    })

    const domains = [
        'GST Return', 'Income Tax', 'MSME', 'PF Services', 'Company Docs', 'Others'
    ]

    const subTypes = {
        'GST Return': ['GSTR-3B', 'GSTR-1', 'GSTR-9A', 'GSTR-9C', 'CMP-08', 'GSTR-4', 'GSTR-10'],
        'Income Tax': ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'ITR-5', 'ITR-6', 'ITR-7', 'COI', 'Computation'],
        'MSME': ['Udyog Aadhaar', 'Udyam Registration'],
        'PF Services': ['PF Withdrawal', 'PF Registration', 'UAN Activation'],
        'Company Docs': ['AOA', 'MOA', 'COI', 'Letterhead', 'Seal'],
        'Others': ['Audit Report', 'Balance Sheet', 'P&L Account']
    }

    useEffect(() => {
        if (clientId) fetchArchives()
    }, [clientId])

    const fetchArchives = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('service_archives')
                .select('*')
                .eq('user_id', clientId)
                .order('created_at', { ascending: false })

            if (data) setArchives(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // --- FILTER & GROUPING LOGIC ---
    const filteredArchives = useMemo(() => {
        return archives.filter(item => {
            const matchesSearch =
                item.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sub_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.service_names?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
            return matchesSearch
        })
    }, [archives, searchQuery])

    // Level 0: Group by Domains
    const domainFolders = useMemo(() => {
        if (currentFolder) return []
        const uniqueDomains = [...new Set(filteredArchives.map(a => a.domain))]
        return uniqueDomains.map(d => ({
            id: d,
            type: 'domain',
            name: d,
            count: filteredArchives.filter(a => a.domain === d).length
        }))
    }, [filteredArchives, currentFolder])

    // Level 1: Group by Sub-types within selected Domain
    const subTypeFolders = useMemo(() => {
        if (!currentFolder) return []
        return Object.values(
            filteredArchives
                .filter(a => a.domain === currentFolder)
                .reduce((acc, item) => {
                    const key = `${item.sub_type}-${item.year}`
                    if (!acc[key]) {
                        acc[key] = {
                            id: key,
                            type: 'sub_type',
                            domain: item.domain,
                            year: item.year,
                            year_type: item.year_type,
                            sub_type: item.sub_type,
                            service_names: item.service_names,
                            files: []
                        }
                    }
                    acc[key].files.push(item)
                    return acc
                }, {})
        )
    }, [filteredArchives, currentFolder])

    const displayItems = currentFolder ? subTypeFolders : domainFolders

    // --- ACTIONS ---
    const handleUpload = async () => {
        if (form.files.length === 0 || !form.year) return alert('Files and Year are required')

        setUploading(true)
        try {
            const adminId = (await supabase.auth.getUser()).data.user.id
            const uploadPromises = Array.from(form.files).map(async (file) => {
                const fileExt = file.name.split('.').pop()
                const fileName = `${clientId}/archives/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('service-archives')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('service-archives')
                    .getPublicUrl(fileName)

                return {
                    user_id: clientId,
                    domain: form.domain,
                    service_names: form.services.length > 0 ? form.services : [form.domain],
                    sub_type: form.subType,
                    year_type: form.yearType,
                    year: form.year,
                    file_url: publicUrl,
                    file_name: file.name,
                    uploaded_by: adminId
                }
            })

            const records = await Promise.all(uploadPromises)
            const { error: dbError } = await supabase
                .from('service_archives')
                .insert(records)

            if (dbError) throw dbError

            fetchArchives()
            setShowUploadModal(false)
            setForm({
                domain: 'GST Return',
                services: [],
                subType: '',
                yearType: 'FY',
                year: new Date().getFullYear().toString(),
                files: []
            })
        } catch (err) {
            console.error(err)
            alert('Upload failed: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id, fileUrl) => {
        if (!window.confirm('Are you sure you want to delete this specific file?')) return

        try {
            // 1. Delete from Storage if it's a Supabase URL
            if (fileUrl && fileUrl.includes('service-archives')) {
                const decoded = decodeURIComponent(fileUrl)
                const parts = decoded.split('/service-archives/')
                if (parts.length > 1) {
                    let storagePath = parts[1].split('?')[0]
                    const { error: storageError } = await supabase.storage
                        .from('service-archives')
                        .remove([storagePath])
                    if (storageError) console.warn("Archive Storage delete warning:", storageError)
                }
            }

            // 2. Delete from DB
            const { error: dbError } = await supabase.from('service_archives').delete().eq('id', id)
            if (dbError) throw dbError

            // Update local state
            setArchives(prev => prev.filter(a => a.id !== id))

            // If the deleted file was part of a selected document folder, update that too
            if (selectedDoc) {
                const updatedFiles = selectedDoc.files.filter(f => f.id !== id)
                if (updatedFiles.length === 0) {
                    setSelectedDoc(null)
                } else {
                    setSelectedDoc({ ...selectedDoc, files: updatedFiles })
                }
            }
        } catch (err) {
            console.error(err)
            alert('Delete failed: ' + err.message)
        }
    }

    const toggleService = (s) => {
        setForm(prev => ({
            ...prev,
            services: prev.services.includes(s)
                ? prev.services.filter(x => x !== s)
                : [...prev.services, s]
        }))
    }

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Library size={20} className="text-indigo-600" />
                        Service Archive Vault
                    </h3>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
                    >
                        <Plus size={16} /> Add Completed Service
                    </button>
                </div>

                {/* Breadcrumbs / Back button */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentFolder(null)}
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${!currentFolder ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-500 hover:text-indigo-600 border border-slate-100'}`}
                        >
                            {currentFolder && <ChevronLeft size={12} />}
                            ROOT
                        </button>
                        {currentFolder && (
                            <>
                                <ChevronRight size={12} className="text-slate-300" />
                                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    {currentFolder}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search archives..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Reading Vault...</p>
                </div>
            ) : displayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <Folder className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">No archives found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    <AnimatePresence mode='popLayout'>
                        {displayItems.map((item) => (
                            <RecordRow
                                key={item.id}
                                item={item}
                                onOpen={(val) => {
                                    if (item.type === 'domain') setCurrentFolder(val)
                                    else setSelectedDoc(item)
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* In-App Viewer Modal */}
            <AnimatePresence>
                {selectedDoc && (
                    <AdminDocumentViewer
                        doc={selectedDoc}
                        onClose={() => setSelectedDoc(null)}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>

            {/* Upload Modal Overlay */}
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
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Archive New Service</h3>
                                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Domain Selection */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Select Domain</label>
                                    <select
                                        value={form.domain}
                                        onChange={(e) => setForm({ ...form, domain: e.target.value, services: [], subType: '' })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    >
                                        {domains.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Year Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Year Type</label>
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            {['AY', 'FY'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setForm({ ...form, yearType: t })}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${form.yearType === t ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Year</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 2023-24"
                                            value={form.year}
                                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Specific Type (Dropdown) */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Sub-Category</label>
                                    <select
                                        value={form.subType}
                                        onChange={(e) => setForm({ ...form, subType: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    >
                                        <option value="">Select Category...</option>
                                        {subTypes[form.domain]?.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Multi-Service Selection */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">5. Combined Services (Optional)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['ITR', 'COI', '3B', 'GSTR-1', 'Audit'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => toggleService(s)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${form.services.includes(s)
                                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                                    : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* File Selection */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">6. Upload Final Document(s)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setForm({ ...form, files: e.target.files })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center group-hover:bg-indigo-50 transition-colors text-center">
                                            <Upload className="text-slate-300 group-hover:text-indigo-600 mb-2" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {form.files.length > 0
                                                    ? `${form.files.length} file(s) selected`
                                                    : 'Click or drop PDF/Image files'}
                                            </p>
                                        </div>
                                    </div>
                                    {form.files.length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-emerald-600 truncate max-w-[80%]">
                                                Selected: {Array.from(form.files).map(f => f.name).join(', ')}
                                            </p>
                                            <button
                                                onClick={() => setForm({ ...form, files: [] })}
                                                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                            >
                                                Clear
                                            </button>
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
                                    disabled={uploading || form.files.length === 0 || !form.year}
                                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {uploading ? 'Archiving...' : 'Complete Archive'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

const RecordRow = ({ item, onOpen }) => {
    const isDomain = item.type === 'domain'

    const getPathPattern = () => {
        if (isDomain) return item.name
        const domain = (item.domain || '').toLowerCase()
        const sub = (item.sub_type || '').toLowerCase()
        if (domain.includes('gst')) return `gst/${sub}`
        if (domain.includes('income tax')) return `income tax / ${sub} ${item.year}`
        return `${domain}/${sub}`
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => onOpen(isDomain ? item.name : item)}
            className="group relative bg-white p-4 pl-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all flex items-center gap-6 cursor-pointer"
        >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-indigo-600 rounded-r-full transition-all" />

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDomain ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                {isDomain ? <Folder size={22} /> : <FileText size={22} />}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-[12px] font-black text-slate-800 tracking-wide uppercase truncate">
                    {getPathPattern()}
                </h3>
                <div className="flex items-center gap-2.5 mt-1">
                    {isDomain ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {item.count} Items inside
                        </span>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                            <Calendar size={10} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">
                                {item.year_type} {item.year}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 pr-2">
                {isDomain ? (
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                ) : (
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                            <Eye size={12} /> View
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

const AdminDocumentViewer = ({ doc, onClose, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const files = doc.files || [doc]
    const currentFile = files[currentIndex]

    const isPDF = currentFile?.file_url?.toLowerCase().endsWith('.pdf')

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
                <button
                    onClick={() => onDelete(currentFile.id, currentFile.file_url)}
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg"
                    title="Delete File"
                >
                    <Trash2 size={20} />
                </button>
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
                >
                    <X size={20} />
                </button>
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-6xl h-full rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
                {/* Multi-file Sidebar */}
                {files.length > 1 && (
                    <div className="w-full md:w-72 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-white">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In this Folder ({files.length})</h5>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {files.map((file, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border ${currentIndex === idx
                                        ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-500/20'
                                        : 'bg-white border-slate-100 hover:shadow-lg hover:border-indigo-100'}`}
                                >
                                    <p className={`text-[11px] font-black line-clamp-2 ${currentIndex === idx ? 'text-white' : 'text-slate-900'}`}>
                                        {file.file_name || `Document ${idx + 1}`}
                                    </p>
                                    <p className={`text-[9px] mt-1 font-bold ${currentIndex === idx ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        Uploaded {new Date(file.created_at).toLocaleDateString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0 bg-slate-100">
                    <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">
                                    {doc.domain} {doc.sub_type ? `- ${doc.sub_type}` : ''}
                                </h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.year_type} {doc.year}</p>
                            </div>
                        </div>
                        <a
                            href={currentFile.file_url}
                            download
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Download size={14} /> Download
                        </a>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
                        {isPDF ? (
                            <iframe
                                src={`${currentFile.file_url}#toolbar=0`}
                                className="w-full h-full rounded-2xl bg-white shadow-inner"
                                title="Admin Document Viewer"
                            />
                        ) : (
                            <img
                                key={currentFile.file_url}
                                src={currentFile.file_url}
                                alt="Document"
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-xl shadow-slate-900/10"
                            />
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default ClientArchivesTab
