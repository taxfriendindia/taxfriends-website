import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Zap, Download, RefreshCw, CheckCircle, Trash2, ShieldCheck, Info, FileStack, UploadCloud } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminService } from '../../services/adminService'
import { useAuth } from '../../contexts/AuthContext'
import StatusModal from '../../components/StatusModal'
import ConfirmationModal from '../../components/ConfirmationModal'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const SuperReset = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [backupLoading, setBackupLoading] = useState(false)
    const [restoreLoading, setRestoreLoading] = useState(false)
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: () => { } })

    // Restriction
    const isSuperAdmin = user?.email === 'taxfriend.tax@gmail.com' || user?.role === 'superuser'

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <ShieldAlert size={64} className="text-rose-500 mb-4" />
                <h1 className="text-2xl font-black text-slate-800">Access Denied</h1>
                <p className="text-slate-500 mt-2">Only the Master Super Admin can access this restricted section.</p>
            </div>
        )
    }

    const handleBackup = async () => {
        try {
            setBackupLoading(true)
            const zip = new JSZip()

            // Fetch All Data
            const tables = ['profiles', 'user_services', 'user_documents', 'notifications']

            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*')
                if (error) throw error
                zip.file(`${table}.json`, JSON.stringify(data, null, 2))
            }

            // Generate ZIP
            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `apnataxfriend_backup_${new Date().toISOString().split('T')[0]}.zip`)

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Backup Successful',
                message: 'A complete snapshot of the database has been downloaded.'
            })
        } catch (error) {
            console.error('Backup failed:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Backup Failed',
                message: error.message
            })
        } finally {
            setBackupLoading(false)
        }
    }

    const handleReset = () => {
        setConfirmModal({
            isOpen: true,
            onConfirm: executeReset
        })
    }

    const executeReset = async () => {
        try {
            setLoading(true)

            // 1. Clean Database (Existing)
            // This clears services, documents, payouts, royalties etc. but KEEPS profiles.
            await AdminService.superResetSystem()

            // 2. Clean Storage Buckets (Only for uploaded documents)
            const buckets = ['user-documents']
            let deletedFilesCount = 0

            for (const bucket of buckets) {
                // List root items to find files and user folders
                const { data: items, error: listError } = await supabase.storage.from(bucket).list()

                if (listError) {
                    console.warn(`Error listing bucket ${bucket}:`, listError)
                    continue
                }

                if (items && items.length > 0) {
                    // Root Files
                    const rootFiles = items.filter(x => x.id).map(x => x.name)
                    if (rootFiles.length > 0) {
                        const { error: remError } = await supabase.storage.from(bucket).remove(rootFiles)
                        if (!remError) deletedFilesCount += rootFiles.length
                    }

                    // User Folders (e.g. user_id/filename.pdf)
                    const folders = items.filter(x => !x.id).map(x => x.name)
                    for (const folder of folders) {
                        const { data: folderFiles } = await supabase.storage.from(bucket).list(folder)
                        if (folderFiles && folderFiles.length > 0) {
                            const pathsToRemove = folderFiles.map(f => `${folder}/${f.name}`)
                            const { error: folderRemError } = await supabase.storage.from(bucket).remove(pathsToRemove)
                            if (!folderRemError) deletedFilesCount += pathsToRemove.length
                        }
                    }
                }
            }

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Clean Restart Complete',
                message: `Service and document history wiped. ${deletedFilesCount} files removed from storage. Note: Client profiles, logins, and avatars have been preserved as requested.`
            })
        } catch (error) {
            console.error('Reset failed:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Reset Failed',
                message: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        try {
            setRestoreLoading(true)
            const zip = new JSZip()
            const zipContent = await zip.loadAsync(file)

            // Restore Order Matters!
            // 1. Profiles (Users)
            // 2. Service Catalog (If present, usually static but good to have)
            // 3. User Services (Depends on Profiles)
            // 4. Other dependent tables
            const restoreOrder = [
                'profiles',
                'service_catalog',
                'user_services',
                'user_documents',
                'notifications',
                'reviews'
            ]

            let restoredCount = 0

            for (const tableName of restoreOrder) {
                const fileName = `${tableName}.json`
                if (zipContent.files[fileName]) {
                    const content = await zipContent.files[fileName].async('string')
                    const data = JSON.parse(content)

                    if (Array.isArray(data) && data.length > 0) {
                        // Chunking to avoid payload limits
                        const CHUNK_SIZE = 100
                        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                            const chunk = data.slice(i, i + CHUNK_SIZE)

                            // Upsert (Insert or Update)
                            const { error } = await supabase
                                .from(tableName)
                                .upsert(chunk, { onConflict: 'id' }) // Assuming 'id' is PK

                            if (error) {
                                console.warn(`Error restoring ${tableName} chunk ${i}:`, error)
                                // We continue despite errors to try maximizing data recovery
                            }
                        }
                        restoredCount++
                    }
                }
            }

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Restore Complete',
                message: `Successfully processed ${restoredCount} tables from the backup.`
            })

        } catch (error) {
            console.error('Restore failed:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Restore Failed',
                message: error.message || 'Invalid backup file.'
            })
        } finally {
            setRestoreLoading(false)
            // Reset input
            event.target.value = ''
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 bg-rose-50 rounded-[2rem] text-rose-600 border border-rose-100 shadow-xl shadow-rose-200/20 mb-4">
                    <Zap size={40} className="fill-rose-500" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Super System Reset</h1>
                <p className="text-slate-500 font-medium max-w-xl mx-auto">
                    A catastrophic action used to purge the system for a new financial year or to clear data limits.
                </p>
            </div>

            {/* Warning Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                        <Info size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">What will be DELETED?</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-slate-500 font-medium">
                            <Trash2 size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>ALL Service histories for clients.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-500 font-medium">
                            <Trash2 size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>ALL Documents & Attempted Storage Wipe.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-500 font-medium">
                            <Trash2 size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>ALL Uploaded document records & Attempted Storage Wipe.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-500 font-medium">
                            <Trash2 size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>ALL System notifications.</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/20">
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-bold">What will be KEPT?</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-emerald-100/70 font-medium">
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>Client Names, Emails & Profile Data.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-emerald-100/70 font-medium">
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>Profile Avatars (Photos).</span>
                        </li>
                        <li className="flex gap-3 text-sm text-emerald-100/70 font-medium">
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>User Roles (Super Admin, Admin, Client).</span>
                        </li>
                        <li className="flex gap-3 text-sm text-emerald-100/70 font-medium">
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>Service Catalog Definitions.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Action Panel */}
            <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Final Countdown</h2>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Perform a backup before purging the system.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <button
                            onClick={handleBackup}
                            disabled={backupLoading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-slate-100 text-slate-800 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            {backupLoading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                            Download Full Backup
                        </button>

                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            Purge System Data
                        </button>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #475569 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                </div>
            </div>

            {/* Restore Panel */}
            <div className="bg-slate-800 rounded-[3rem] p-10 border-2 border-slate-700 shadow-2xl relative overflow-hidden text-white mt-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <UploadCloud size={24} className="text-blue-400" />
                            <h2 className="text-2xl font-black">Restore System Data</h2>
                        </div>
                        <p className="text-slate-400 font-medium text-sm max-w-xl">
                            Import a previously downloaded backup (.zip). This will attempt to merge and update existing records.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <label className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-900/50">
                            {restoreLoading ? <RefreshCw className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                            <span>{restoreLoading ? 'Restoring...' : 'Select Backup File'}</span>
                            <input
                                type="file"
                                accept=".zip"
                                className="hidden"
                                onChange={handleRestore}
                                disabled={restoreLoading}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Summary Footer */}
            <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <FileStack className="text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    <strong>Note:</strong> While we attempt to clear files, deep storage folders might remain. To DELETE Login Accounts (Email/Passwords), you MUST use the Supabase Dashboard &gt; Authentication &gt; Users, as deleting users is a high-security action restricted from this panel.
                </p>
            </div>

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title="SURELY REMOVE ALL DATA?"
                message="This is a DESTRUCTIVE action. All client records and service requests will be erased FOREVER. Only login accounts will remain. Continue?"
                danger={true}
                confirmLabel="Yes, Erase Everything"
            />
        </div>
    )
}

export default SuperReset
