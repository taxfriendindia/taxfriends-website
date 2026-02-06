import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import ClientDocumentManager from '../../components/Documents/ClientDocumentManager'
import { useLocation } from 'react-router-dom'
import { FileText } from 'lucide-react'

const Documents = () => {
    const { user } = useAuth()
    const location = useLocation()
    const [serviceContext, setServiceContext] = useState('')

    useEffect(() => {
        if (location.state?.serviceName) {
            setServiceContext(location.state.serviceName)
        }
    }, [location])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                    <FileText size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Uploads</h1>
                    <p className="text-slate-500">
                        Upload and manage the documents you've sent to TaxFriend.
                    </p>
                </div>
            </div>

            {/* Strict Client Input Stream */}
            <ClientDocumentManager
                userId={user?.id}
                serviceName={serviceContext}
            />
        </div>
    )
}

export default Documents
