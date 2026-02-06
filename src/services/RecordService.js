import { supabase } from '../lib/supabase'

export const RecordService = {
    /**
     * Get records for a user, optionally filtered by folder
     * @param {string} userId
     * @param {string|null} folderId
     */
    async getUserRecords(userId, folderId = null) {
        let query = supabase
            .from('service_records')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (folderId === null) {
            query = query.is('folder_id', null)
        } else {
            query = query.eq('folder_id', folderId)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
    },

    /**
     * Upload a completed service record (Admin Only)
     */
    async uploadRecord(userId, folderId, file, category = 'General') {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/records/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        // Upload to 'admin_deliverables' bucket (or fallback to 'service-archives' if not set up)
        const bucketName = 'service-archives' // Using existing bucket for now, but logical separation in DB
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName)

        const { data, error } = await supabase
            .from('service_records')
            .insert([{
                user_id: userId,
                folder_id: folderId,
                file_name: file.name,
                file_url: publicUrl,
                file_size: file.size,
                file_type: file.type,
                category: category,
                status: 'completed'
            }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Delete a record (Admin Only)
     */
    async deleteRecord(recordId, fileUrl) {
        // Delete from storage
        if (fileUrl) {
            const bucketName = 'service-archives'
            const path = fileUrl.split(`${bucketName}/`)[1]
            if (path) {
                await supabase.storage.from(bucketName).remove([path.split('?')[0]])
            }
        }

        const { error } = await supabase
            .from('service_records')
            .delete()
            .eq('id', recordId)

        if (error) throw error
    }
}
