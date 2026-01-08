import { supabase } from '../lib/supabase'
import { subDays } from 'date-fns'

export const AdminService = {
    async getStats(filters = {}) {
        let profileQuery = supabase.from('profiles').select('*', { count: 'exact', head: true })
        let serviceQuery = supabase.from('user_services').select('*, profiles:user_id!inner(*)', { count: 'exact', head: true })
        let rejectedQuery = supabase.from('user_services').select('*, profiles:user_id!inner(*)', { count: 'exact', head: true }).in('status', ['rejected', 'cancelled'])

        // 1. Apply Filters (Handle both Residential and Business columns)
        if (filters.city && filters.city !== 'All') {
            profileQuery = profileQuery.or(`residential_city.eq.${filters.city},business_city.eq.${filters.city}`)
            serviceQuery = serviceQuery.or(`profiles.residential_city.eq.${filters.city},profiles.business_city.eq.${filters.city}`)
            rejectedQuery = rejectedQuery.or(`profiles.residential_city.eq.${filters.city},profiles.business_city.eq.${filters.city}`)
        }
        if (filters.state && filters.state !== 'All') {
            profileQuery = profileQuery.or(`residential_state.eq.${filters.state},business_state.eq.${filters.state}`)
            serviceQuery = serviceQuery.or(`profiles.residential_state.eq.${filters.state},profiles.business_state.eq.${filters.state}`)
            rejectedQuery = rejectedQuery.or(`profiles.residential_state.eq.${filters.state},profiles.business_state.eq.${filters.state}`)
        }
        if (filters.admin && filters.admin !== 'All') {
            serviceQuery = serviceQuery.eq('handled_by', filters.admin)
            rejectedQuery = rejectedQuery.eq('handled_by', filters.admin)
        }


        // 2. Fetch Counts
        const [usersRes, reqsRes, rejectedRes] = await Promise.all([
            profileQuery,
            serviceQuery,
            rejectedQuery
        ])

        const recentTime = subDays(new Date(), 30).toISOString()
        const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', recentTime)



        return {
            totalUsers: usersRes.count || 0,
            newUsers: newUsers || 0,
            totalReqs: reqsRes.count || 0,
            rejectedReqs: rejectedRes.count || 0
        }
    },

    async superResetSystem() {
        const { error } = await supabase.rpc('super_reset_system')
        if (error) throw error
        return true
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
    },

    async getAdminPerformance() {
        try {
            // 1. Fetch performance from Services
            const { data: servs, error: sErr } = await supabase
                .from('user_services')
                .select('handled_by, status')
                .not('handled_by', 'is', null);

            if (sErr) throw sErr;

            // 2. Fetch performance from Documents (Verifications)
            const { data: docs, error: dErr } = await supabase
                .from('user_documents')
                .select('handled_by, status')
                .not('handled_by', 'is', null);

            if (dErr) throw dErr;

            const performance = {};

            // Helper to initialize and update performance object
            const updatePerf = (records, isDoc = false) => {
                records.forEach(curr => {
                    const adminId = curr.handled_by;
                    if (!performance[adminId]) {
                        performance[adminId] = { total: 0, completed: 0, rejected: 0, verified: 0, pending: 0, processing: 0 };
                    }
                    performance[adminId].total += 1;
                    const status = curr.status?.toLowerCase();

                    if (status === 'completed') performance[adminId].completed += 1;
                    else if (status === 'rejected' || status === 'cancelled') performance[adminId].rejected += 1;
                    else if (status === 'verified') {
                        performance[adminId].verified += 1;
                        if (isDoc) performance[adminId].completed += 1; // Count doc verification as a resolved task
                    }
                    else if (status === 'processing') performance[adminId].processing += 1;
                    else if (status === 'pending') performance[adminId].pending += 1;
                });
            };

            updatePerf(servs || []);
            updatePerf(docs || [], true);

            return performance;
        } catch (e) {
            console.error("Admin Performance Error:", e);
            return {};
        }
    },

    async getDailyStats() {
        try {
            const days = Array.from({ length: 7 }, (_, i) => {
                const date = subDays(new Date(), i);
                return date.toISOString().split('T')[0];
            }).reverse();

            const { data: requests } = await supabase
                .from('user_services')
                .select('created_at, status')
                .gte('created_at', subDays(new Date(), 7).toISOString());

            const stats = days.map(day => {
                const dayReqs = (requests || []).filter(r => r.created_at.startsWith(day));
                return {
                    day,
                    total_requests: dayReqs.length,
                    completed: dayReqs.filter(r => r.status === 'completed').length
                };
            });

            return stats;
        } catch (e) {
            console.error("Manual Daily Stats Error:", e);
            return [];
        }
    }
}
