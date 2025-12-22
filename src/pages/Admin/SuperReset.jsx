import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Zap, Download, RefreshCw, CheckCircle, Trash2, ShieldCheck, Info, FileStack } from 'lucide-react'
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
            const tables = ['profiles', 'user_services', 'payout_requests', 'partner_royalties', 'user_documents', 'notifications']

            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*')
                if (error) throw error
                zip.file(`${table}.json`, JSON.stringify(data, null, 2))
            }

            // Generate ZIP
            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `taxfriends_backup_${new Date().toISOString().split('T')[0]}.zip`)

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
            await AdminService.superResetSystem()

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'System Purged',
                message: 'All historical data has been removed. The system is now in a fresh state.'
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
                            <span>ALL Service histories for clients & partners.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-500 font-medium">
                            <Trash2 size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>ALL Payout requests and settled history.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-500 font-medium">
                            <Trash2 size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>ALL Royalty and subscription records.</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-500 font-medium">
                            <Trash2 size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>ALL Uploaded document records.</span>
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
                            <span>User Login Accounts (Emails & Passwords).</span>
                        </li>
                        <li className="flex gap-3 text-sm text-emerald-100/70 font-medium">
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>User Roles (Super Admin, Partner, Client).</span>
                        </li>
                        <li className="flex gap-3 text-sm text-emerald-100/70 font-medium">
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>Service Catalog (The menu of services).</span>
                        </li>
                        <li className="flex gap-3 text-sm text-emerald-100/70 font-medium">
                            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>Profile Details (Names, org, contact).</span>
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

            {/* Summary Footer */}
            <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <FileStack className="text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    <strong>Note:</strong> Files in Supabase Storage buckets are not physically deleted by this action to prevent accidental data loss. This purge only clears the database linkages and records. To clear your bucket, use the Supabase Storage Dashboard directly.
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
                message="This is a DESTRUCTIVE action. All clients records, partner earnings, and requests will be erased FOREVER. Only login accounts will remain. Continue?"
                danger={true}
                confirmLabel="Yes, Erase Everything"
            />
        </div>
    )
}

export default SuperReset
