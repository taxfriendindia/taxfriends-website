import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AdContainer = ({
    slotId,
    format = 'auto',
    className = '',
    label = 'Advertisement'
}) => {
    const { user, loading } = useAuth()
    const location = useLocation()
    const adRef = useRef(null)

    // Conditional Rendering Logic
    const protectedPaths = ['/dashboard', '/admin', '/client', '/login']
    const isProtectedRoute = protectedPaths.some(path => location.pathname.startsWith(path))

    if (loading || user || isProtectedRoute) {
        return null
    }

    useEffect(() => {
        // This is where you would normally initialize the ad script
        // For now, we'll just log that the ad slot is ready
        if (adRef.current) {
            console.log(`Ad slot ${slotId} ready`)
        }
    }, [slotId])

    return (
        <div className={`my-4 w-full flex flex-col items-center max-w-7xl mx-auto px-4 ${className}`}>
            <span className="text-xs text-gray-400 uppercase tracking-wider mb-1 self-start ml-1">{label}</span>
            <div
                ref={adRef}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[100px] flex items-center justify-center border border-gray-200 dark:border-gray-700 overflow-hidden relative"
            >
                <div className="absolute inset-0 flex items-center justify-center opacity-50">
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                        Ad Space
                    </span>
                </div>
                {/* This is where the actual ad code would be injected */}
                {/* <ins className="adsbygoogle" ... /> */}
            </div>
        </div>
    )
}

export default AdContainer
