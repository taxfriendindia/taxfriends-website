import { supabase } from '../lib/supabase'
import { subDays } from 'date-fns'

export const AdminService = {
    async getStats() {
        const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        const { count: totalReqs } = await supabase.from('user_services').select('*', { count: 'exact', head: true })
        const { count: rejectedReqs } = await supabase.from('user_services').select('*', { count: 'exact', head: true }).in('status', ['rejected', 'cancelled'])

        const recentTime = subDays(new Date(), 30).toISOString()
        const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', recentTime)

        return {
            totalUsers: totalUsers || 0,
            newUsers: newUsers || 0,
            totalReqs: totalReqs || 0,
            rejectedReqs: rejectedReqs || 0
        }
    },

    async getRecentActivity() {
        // 1. Recent Documents
        const { data: recentDocs } = await supabase.from('user_documents')
            .select('created_at, name, status').order('created_at', { ascending: false }).limit(3)

        // 2. Recent Service Requests (Fix: Join with catalog)
        const { data: recentServs } = await supabase.from('user_services')
            .select(`
                created_at, 
                status, 
                service_catalog ( title )
            `)
            .order('created_at', { ascending: false })
            .limit(3)

        // 3. New Users (Newly Joined)
        const { data: recentUsers } = await supabase.from('profiles')
            .select('created_at, full_name, email')
            .order('created_at', { ascending: false })
            .limit(3)

        const activities = [
            ...(recentDocs || []).map(x => ({
                type: 'doc',
                text: `Document: ${x.name}`,
                date: x.created_at,
                status: x.status || 'uploaded'
            })),
            ...(recentServs || []).map(x => ({
                type: 'service',
                text: `Request: ${x.service_catalog?.title || 'Unknown Service'}`,
                date: x.created_at,
                status: x.status
            })),
            ...(recentUsers || []).map(x => ({
                type: 'user',
                text: `New User: ${x.full_name || x.email?.split('@')[0]}`,
                date: x.created_at,
                status: 'joined'
            }))
        ]

        return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7)
    }
}
