import { supabase } from '../lib/supabase'

export const RequestService = {
    async getLatestForUser(userId) {
        const { data, error } = await supabase
            .from('user_services')
            .select('*, service:service_catalog(title)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
        if (error) throw error
        return data
    },

    async checkActiveRequest(userId, serviceId) {
        const { data, error } = await supabase
            .from('user_services')
            .select('id, status')
            .eq('user_id', userId)
            .eq('service_id', serviceId)
            .in('status', ['pending', 'processing'])
            .maybeSingle()
        if (error) throw error
        return data
    },

    async createRequest(userId, serviceId, comments = '') {
        const { error } = await supabase
            .from('user_services')
            .insert([{
                user_id: userId,
                service_id: serviceId,
                status: 'pending',
                comments,
                created_at: new Date()
            }])
        if (error) throw error
    }
}
