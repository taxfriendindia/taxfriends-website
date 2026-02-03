import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SimpleFileManager from '../../components/Documents/SimpleFileManager'
import { Folder } from 'lucide-react'

const Documents = () => {
    const { user } = useAuth()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                    <Folder size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Document Vault</h1>
                    <p className="text-slate-500">Manage all your tax documents, returns, and files safely in one place.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <SimpleFileManager userId={user?.id} readOnly={true} />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <div className="mt-1 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                </div>
                <div>
                    <h4 className="font-bold text-blue-900">Secure Storage</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        All your documents are encrypted and stored securely. Only you and your assigned tax expert can access them.
                        You can view and download your files anytime. For new uploads, please contact your tax expert.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Documents
