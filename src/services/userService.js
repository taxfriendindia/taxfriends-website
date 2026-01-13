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
        // NOTE: This is now handled automatically by a database trigger in Supabase.
        // This method remains as a secondary safety measure or for manual calls.
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { error } = await supabase
                .from('notifications')
                .delete()
                .lt('created_at', sevenDaysAgo.toISOString());

            if (error) throw error;
        } catch (e) {
            console.error("Cleanup failed:", e);
        }
    },

    async uploadDocument(userId, file, name, docType, uploadedBy = null) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${userId}/documents/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('user-documents')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('user-documents')
            .getPublicUrl(filePath)

        const documentData = {
            user_id: userId,
            name: name,
            file_url: publicUrl,
            doc_type: docType,
            status: 'pending'
        };


        if (uploadedBy) {
            documentData.uploaded_by = uploadedBy;
        }

        const { error: dbError } = await supabase.from('user_documents').insert([documentData])

        if (dbError) throw dbError
        return publicUrl
    }
}
