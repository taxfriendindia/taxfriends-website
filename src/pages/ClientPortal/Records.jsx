import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Folder, FileText, ChevronRight, Search, Filter,
    X, Download, ExternalLink, Calendar, ChevronLeft,
    Clock, Tag, Library, Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const Records = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [archives, setArchives] = useState([])
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [activeDomain, setActiveDomain] = useState('All')
    const [activeYear, setActiveYear] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')

    const [currentFolder, setCurrentFolder] = useState(null) // null = root, 'GST Return' = inside GST

    // Domains based on requirements
    const domains = ['All', 'GST Return', 'Income Tax', 'MSME', 'PF Services', 'Company Docs', 'Others']

    useEffect(() => {
        if (user) fetchArchives()
    }, [user])

    const fetchArchives = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('service_archives')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setArchives(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredArchives = archives.filter(item => {
        const matchesDomain = activeDomain === 'All' || item.domain === activeDomain
        const matchesYear = activeYear === 'All' || item.year === activeYear
        const matchesSearch = item.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sub_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.service_names?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesDomain && matchesYear && matchesSearch
    })

    const years = ['All', ...new Set(archives.map(a => a.year).filter(Boolean).sort((a, b) => b.localeCompare(a)))]

    // Level 0: Group by Domains
    const domainFolders = !currentFolder ? [...new Set(filteredArchives.map(a => a.domain))].map(d => ({
        id: d,
        type: 'domain',
        name: d,
        count: filteredArchives.filter(a => a.domain === d).length
    })) : []

    // Level 1: Group by Sub-types within selected Domain
    const subTypeFolders = currentFolder ? Object.values(
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
    ) : []

    const displayItems = currentFolder ? subTypeFolders : domainFolders

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Library className="text-indigo-600" />
                        My Records
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Access and view your completed service documents.</p>
                </div>
            </div>

            {/* Breadcrumbs / Back button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentFolder(null)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${!currentFolder ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-gray-800 text-slate-500 hover:text-indigo-600 border border-slate-100 dark:border-slate-700'}`}
                    >
                        {currentFolder && <ChevronLeft size={14} />}
                        ROOT
                    </button>
                    {currentFolder && (
                        <>
                            <ChevronRight size={14} className="text-slate-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                {currentFolder}
                            </span>
                        </>
                    )}
                </div>
                {currentFolder && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Viewing All {currentFolder} Folders
                    </p>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by service or file name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <FilterSelect
                        value={activeDomain}
                        options={domains}
                        onChange={setActiveDomain}
                        label="Domain"
                    />
                    <FilterSelect
                        value={activeYear}
                        options={years}
                        onChange={setActiveYear}
                        label="Year"
                    />
                </div>
            </div>

            {/* Content Area - List Format */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
                </div>
            ) : displayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <Folder className="w-16 h-16 text-gray-200 dark:text-gray-800 mb-4" />
                    <p className="text-gray-500 font-bold">No records found matching your filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
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
                    <DocumentViewer
                        doc={selectedDoc}
                        onClose={() => setSelectedDoc(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

const FilterSelect = ({ label, value, options, onChange }) => (
    <div className="flex flex-col min-w-[120px]">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl px-4 py-2.5 text-xs font-black text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
        >
            <option disabled>{label}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
)

const RecordRow = ({ item, onOpen }) => {
    const isDomain = item.type === 'domain'

    // Determine path pattern for sub_types
    const getPathPattern = () => {
        if (isDomain) return item.name

        const domain = (item.domain || '').toLowerCase()
        const sub = (item.sub_type || '').toLowerCase()

        if (domain.includes('gst')) {
            return `gst/${sub}`
        }
        if (domain.includes('income tax')) {
            const yearStr = item.year ? ` ${item.year}` : ''
            return `income tax filing foulder / ${sub}${yearStr}`
        }
        return `${domain}/${sub}`
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onOpen(isDomain ? item.name : item)}
            className="group relative bg-white dark:bg-gray-800 p-4 pl-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex items-center gap-6 cursor-pointer"
        >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-indigo-600 rounded-r-full transition-all" />

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDomain ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                {isDomain ? <Folder size={22} /> : <FileText size={22} />}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-100 tracking-wide uppercase">
                    {getPathPattern()}
                </h3>
                <div className="flex items-center gap-2.5 mt-1">
                    {isDomain ? (
                        <span className="text-[10px] font-bold text-slate-400">
                            {item.count} Record{item.count !== 1 ? 's' : ''} inside
                        </span>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-md">
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
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                ) : (
                    <>
                        <button
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/10"
                        >
                            <Eye size={12} />
                            View
                        </button>
                        <a
                            href={item.files && item.files[0]?.file_url}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all"
                        >
                            <Download size={18} />
                        </a>
                    </>
                )}
            </div>
        </motion.div>
    )
}

const DocumentViewer = ({ doc, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const files = doc.files || [doc]
    const currentFile = files[currentIndex]

    const isPDF = currentFile?.file_url?.toLowerCase().endsWith('.pdf')

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-8"
        >
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
                <a
                    href={currentFile.file_url}
                    download
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                    title="Download Current"
                >
                    <Download size={20} />
                </a>
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-gray-900 w-full max-w-6xl h-full rounded-[2rem] overflow-hidden flex flex-col md:flex-row relative shadow-2xl"
            >
                {/* Multi-file Sidebar */}
                {files.length > 1 && (
                    <div className="w-full md:w-64 border-r dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
                        <div className="p-4 border-b dark:border-gray-800">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Folder Documents ({files.length})</h5>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {files.map((file, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border ${currentIndex === idx
                                        ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-300'}`}
                                >
                                    <p className={`text-[10px] font-black line-clamp-2 ${currentIndex === idx ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {file.file_name || `Document ${idx + 1}`}
                                    </p>
                                    <p className={`text-[8px] mt-1 font-bold ${currentIndex === idx ? 'text-indigo-100' : 'text-gray-400'}`}>
                                        {new Date(file.created_at).toLocaleDateString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Internal Viewer Header */}
                    <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 dark:text-white text-sm">
                                    {doc.domain} {doc.sub_type ? `- ${doc.sub_type}` : ''}
                                </h4>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{doc.year_type} {doc.year}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Viewport */}
                    <div className="flex-1 bg-gray-100 dark:bg-gray-950 flex items-center justify-center overflow-auto relative">
                        {isPDF ? (
                            <iframe
                                src={`${currentFile.file_url}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="Document Viewer"
                            />
                        ) : (
                            <img
                                key={currentFile.file_url}
                                src={currentFile.file_url}
                                alt="Document"
                                className="max-w-full max-h-full object-contain"
                            />
                        )}
                    </div>
                </div>

                {/* Navigation arrows for single list if no sidebar? Or just keep sidebar. */}
            </motion.div>
        </motion.div>
    )
}

export default Records
