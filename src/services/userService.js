import { supabase } from '../lib/supabase'

export const UserService = {
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (error) throw error
        return data
    },

    async createNotification(userId, title, message, type = 'info') {
        const { error } = await supabase.from('notifications').insert([{
            user_id: userId,
            title,
            message,
            type,
            is_read: false,
            created_at: new Date()
        }])
        if (error) throw error
    },

    async cleanupNotifications() {
        try {
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 72);

            const { error } = await supabase
                .from('notifications')
                .delete()
                .in('type', ['info', 'success', 'error', 'system'])
                .lt('created_at', yesterday.toISOString());

            if (error) throw error;
            console.log("Cleanup: Old automated notifications removed.");
        } catch (e) {
            console.error("Cleanup failed:", e);
        }
    }
}
