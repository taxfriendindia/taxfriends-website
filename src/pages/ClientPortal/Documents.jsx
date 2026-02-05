import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SimpleFileManager from '../../components/Documents/SimpleFileManager'
import ServiceDocumentUploader from '../../components/Documents/ServiceDocumentUploader'
import { Upload, FolderOpen } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const Documents = () => {
    const { user } = useAuth()
    const location = useLocation()
    const [serviceContext, setServiceContext] = useState(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        if (location.state?.serviceName) {
            setServiceContext(location.state.serviceName)
        }
    }, [location])

    const handleUploadComplete = () => {
        setRefreshTrigger(prev => prev + 1)
        setServiceContext(null) // Clear context after upload
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                    <Upload size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Upload Documents</h1>
                    <p className="text-slate-500">
                        {serviceContext
                            ? `Please upload documents required for ${serviceContext}`
                            : "Upload your PAN, Aadhaar, bank statements, or any documents for your tax expert."}
                    </p>
                </div>
            </div>

            {/* New Main Uploader Section */}
            <ServiceDocumentUploader
                serviceName={serviceContext}
                onUploadComplete={handleUploadComplete}
            />

            <div className="flex items-center gap-2 mt-8 mb-4">
                <FolderOpen className="text-slate-400" size={20} />
                <h3 className="text-lg font-bold text-slate-700">My Document Vault</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <SimpleFileManager
                    key={refreshTrigger}
                    userId={user?.id}
                    readOnly={false}
                />
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                <div className="mt-1 text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                </div>
                <div>
                    <h4 className="font-bold text-emerald-900">Secure Storage</h4>
                    <p className="text-sm text-emerald-700 mt-1">
                        Create folders, upload files, and share them with your tax expert. Your data is encrypted and secure.
                        Your assigned expert will be able to view and download these documents.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Documents
