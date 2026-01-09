import React, { useState } from 'react'
import { Database, Download, Upload, Trash2, AlertTriangle, Shield, Archive, CheckCircle2, FileJson } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import StatusModal from '../../components/StatusModal'
import ConfirmationModal from '../../components/ConfirmationModal'

import { useAuth } from '../../contexts/AuthContext'

const AdminDataCleaner = () => {
    const { user } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' })
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: () => { } })
    const [backupFile, setBackupFile] = useState(null)

    const isSuperUser = user?.role === 'superuser' || user?.email === 'taxfriend.tax@gmail.com'

    const handleCreateBackup = async () => {
        setIsProcessing(true)
        try {
            // Fetch only essential data for the free tier maintenance backup
            const { data: profiles } = await supabase.from('profiles').select('*')
            const { data: services } = await supabase.from('user_services').select('*')
            const { data: documents } = await supabase.from('user_documents').select('*')
            const { data: catalog } = await supabase.from('service_catalog').select('*')

            const backup = {
                metadata: {
                    created_at: new Date().toISOString(),
                    platform: 'TaxFriend India',
                    type: 'Essential Data Backup'
                },
                profiles: profiles || [],
                services: services || [],
                documents: documents || [],
                catalog: catalog || []
            }

            const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // DD-MM-YYYY
            const filename = `${dateStr}_TaxFriend India_Backup.zip`

            const zip = new JSZip()
            zip.file("data.json", JSON.stringify(backup, null, 2))

            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, filename)

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Backup Ready',
                message: `Successfully created backup with ${profiles?.length || 0} clients, ${services?.length || 0} services, and ${documents?.length || 0} documents.`
            })
        } catch (error) {
            console.error('Backup failed:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Backup Failed',
                message: error.message || 'Failed to create backup'
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const clearBucket = async (bucketName) => {
        try {
            const { data: files } = await supabase.storage.from(bucketName).list('', { limit: 1000 })
            if (files && files.length > 0) {
                const filesToDelete = files.map(f => f.name)
                await supabase.storage.from(bucketName).remove(filesToDelete)
                return files.length
            }
            return 0
        } catch (error) {
            console.error(`Error clearing bucket ${bucketName}:`, error)
            return 0
        }
    }

    const handleClearData = async () => {
        if (!isSuperUser) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Access Denied',
                message: 'Only the Superuser can perform a deep server purge.'
            })
            return
        }
        setConfirmModal({
            isOpen: true,
            onConfirm: executeClearData
        })
    }

    const executeClearData = async () => {
        setIsProcessing(true)
        try {
            // 1. Clear Storage
            await clearBucket('user-documents')
            await clearBucket('avatars')

            // 2. Clear Transactional Tables
            await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('user_services').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('user_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')

            // Note: We don't delete profiles because that would delete user accounts
            // We just reset their status
            await supabase.from('profiles').update({ kyc_status: 'not_started' }).neq('role', 'superuser')

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Server Cleaned',
                message: `All transactional data and storage files have been cleared.`
            })
        } catch (error) {
            console.error('Clear failed:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Operation Failed',
                message: 'Internal server error during cleaning.'
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setIsProcessing(true)
            let data = null
            if (file.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file)
                const jsonFile = zip.file("data.json")
                if (jsonFile) {
                    const content = await jsonFile.async("string")
                    data = JSON.parse(content)
                }
            } else if (file.name.endsWith('.json')) {
                const content = await file.text()
                data = JSON.parse(content)
            }

            if (data) {
                setBackupFile({ name: file.name, data })
            } else {
                throw new Error("Invalid backup format")
            }
        } catch (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Selection Failed',
                message: 'The file appears to be corrupted or invalid.'
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRestore = async () => {
        if (!backupFile) return
        if (!isSuperUser) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Access Denied',
                message: 'Only the Superuser can restore system data.'
            })
            return
        }
        setConfirmModal({
            isOpen: true,
            onConfirm: executeRestore
        })
    }

    const executeRestore = async () => {
        setIsProcessing(true)
        try {
            const { data } = backupFile

            const chunkedUpsert = async (table, items) => {
                const CHUNK_SIZE = 50
                for (let i = 0; i < items.length; i += CHUNK_SIZE) {
                    const chunk = items.slice(i, i + CHUNK_SIZE)
                    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' })
                    if (error) throw error
                }
            }

            // Restore logic - Executed in order of dependency

            // 1. Service Catalog (The "Menu")
            if (data.catalog?.length > 0) {
                await chunkedUpsert('service_catalog', data.catalog)
            }

            // 2. Profiles (The "Users")
            if (data.profiles?.length > 0) {
                await chunkedUpsert('profiles', data.profiles)
            }

            // 3. Services (The "Orders")
            if (data.services?.length > 0) {
                await chunkedUpsert('user_services', data.services)
            }

            // 4. Documents (The "Files")
            if (data.documents?.length > 0) {
                await chunkedUpsert('user_documents', data.documents)
            }

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Restore Complete',
                message: 'System data has been successfully re-imported.'
            })
            setBackupFile(null)
        } catch (error) {
            console.error('Restore failed:', error)
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Restore Failed',
                message: 'Some records could not be restored.'
            })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col space-y-8 max-w-5xl mx-auto py-6"
        >
            {/* Minimal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Database className="text-emerald-600" size={32} />
                        Data Management
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Export, cleanup, and restore platform data</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <Shield size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Admin Control</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Backup Area */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                        <Download size={36} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Download Backup</h2>
                    <p className="text-sm text-slate-500 mt-2 mb-8 px-4">
                        Secures client profiles, service history, and document logs into a portable ZIP.
                    </p>

                    <button
                        onClick={handleCreateBackup}
                        disabled={isProcessing}
                        className="w-full relative group/btn disabled:opacity-50"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-25 group-hover/btn:opacity-50 transition"></div>
                        <div className="relative bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]">
                            {isProcessing ? "Processing..." : <><Download size={18} /> Backup Now</>}
                        </div>
                    </button>
                </div>

                {/* Restore Area */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-6 shadow-inner">
                        <Upload size={36} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Upload & Restore</h2>
                    <p className="text-sm text-slate-500 mt-2 mb-6 px-4">
                        Re-import previously downloaded ZIP or JSON backup files.
                    </p>

                    <div className="w-full relative">
                        <input type="file" accept=".zip,.json" onChange={handleFileSelect} className="hidden" id="restore-input" />
                        <label
                            htmlFor="restore-input"
                            className={`w-full flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${backupFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}
                        >
                            <div className={`p-2 rounded-lg mb-2 ${backupFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {backupFile ? <CheckCircle2 size={24} /> : <Archive size={24} />}
                            </div>
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">
                                {backupFile ? backupFile.name : "Select Backup File"}
                            </span>
                        </label>
                    </div>

                    {backupFile && (
                        <button
                            onClick={handleRestore}
                            disabled={isProcessing || !isSuperUser}
                            className={`w-full mt-4 text-white font-black py-4 rounded-2xl transition active:scale-[0.98] ${!isSuperUser ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            {!isSuperUser ? "Superuser Only" : "Run Import"}
                        </button>
                    )}
                </div>
            </div>

            {/* Danger Section */}
            <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 mt-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-rose-900">Deep Server Purge</h3>
                            <p className="text-sm text-rose-700/80 font-medium">Permanently clear storage and transactional data to free up space.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearData}
                        disabled={isProcessing || !isSuperUser}
                        className={`px-8 py-4 text-white font-black rounded-2xl transition active:scale-95 whitespace-nowrap ${!isSuperUser ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
                    >
                        {!isSuperUser ? "Restricted" : "Clear All Data"}
                    </button>
                </div>
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
                danger={true}
                title="Strict Confirmation"
                message="This action is irreversible and will delete all service logs, uploaded documents, and broadcast history."
            />
        </motion.div>
    )
}

export default AdminDataCleaner
