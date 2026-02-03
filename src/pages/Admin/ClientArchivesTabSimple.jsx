import React from 'react'
import { Library } from 'lucide-react'
import SimpleFileManager from '../../components/Documents/SimpleFileManager'

/**
 * ClientArchivesTab - Simple Version
 * Clean Windows-style file manager interface
 */
const ClientArchivesTab = ({ clientId }) => {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Library size={20} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg">Document Archive</h3>
            </div>

            {/* Simple File Manager */}
            <SimpleFileManager userId={clientId} />
        </div>
    )
}

export default ClientArchivesTab
