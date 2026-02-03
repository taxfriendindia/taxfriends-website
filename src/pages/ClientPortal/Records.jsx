import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SimpleFileManager from '../../components/Documents/SimpleFileManager'
import { Library } from 'lucide-react'

const Records = () => {
    const { user } = useAuth()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                    <Library size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Records</h1>
                    <p className="text-slate-500">Access and view your completed service documents.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <SimpleFileManager userId={user?.id} readOnly={true} />
            </div>
        </div>
    )
}

export default Records
