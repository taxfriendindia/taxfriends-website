import React, { useState, useEffect } from 'react'
import { Megaphone, Send, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AdminAnnouncements = () => {
    const [message, setMessage] = useState('')
    const [title, setTitle] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [stats, setStats] = useState({ totalUsers: 0, sentCount: 0 })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        setStats(prev => ({ ...prev, totalUsers: count || 0 }))
    }

    const handleBroadcast = async () => {
        if (!message.trim() || !title.trim()) {
            alert('Please enter both title and message.')
            return
        }

        if (!confirm(`Are you sure you want to send this announcement to ALL ${stats.totalUsers} users? This cannot be undone.`)) {
            return
        }

        setIsSending(true)
        try {
            // 1. Fetch all user IDs
            const { data: users, error: uError } = await supabase
                .from('profiles')
                .select('id')

            if (uError) throw uError

            if (!users || users.length === 0) {
                alert('No users found to send to.')
                return
            }

            // 2. Prepare Notification Objects
            const notifications = users.map(user => ({
                user_id: user.id,
                title: title,
                message: message,
                type: 'broadcast',
                read: false,
                created_at: new Date()
            }))

            // 3. Batch Insert
            // Supabase limits batch size, let's chunk it if needed (e.g. 1000)
            const chunkSize = 100
            for (let i = 0; i < notifications.length; i += chunkSize) {
                const chunk = notifications.slice(i, i + chunkSize)
                const { error: iError } = await supabase
                    .from('notifications')
                    .insert(chunk)

                if (iError) throw iError
            }

            alert(`Successfully broadcasted to ${users.length} users.`)
            setMessage('')
            setTitle('')
        } catch (error) {
            console.error('Broadcast failed:', error)
            alert('Failed to send broadcast.')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Megaphone className="text-indigo-600" size={32} />
                    Broadcast Announcements
                </h1>
                <p className="text-slate-500 mt-2">Send important updates, deadlines, or news to every registered user instantly.</p>
            </div>

            {/* Compose Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Megaphone size={120} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Announcement Title</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg text-slate-800"
                            placeholder="e.g. Important: GST Filing Deadline Approaching"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Message Content</label>
                        <textarea
                            className="w-full h-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700"
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        ></textarea>
                        <p className="text-xs text-slate-400 mt-2 text-right">
                            {message.length} characters
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-amber-800 text-sm">Warning</h4>
                            <p className="text-amber-700 text-xs mt-1">
                                This will send a notification to <b>{stats.totalUsers} users</b> immediately. This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleBroadcast}
                            disabled={isSending || !title.trim() || !message.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-xl shadow-indigo-200 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isSending ? (
                                <>Sending...</>
                            ) : (
                                <>
                                    <Send size={20} /> Send Broadcast Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Optional: Recent Announcements or Template Section could go here in future */}
        </div>
    )
}

export default AdminAnnouncements
