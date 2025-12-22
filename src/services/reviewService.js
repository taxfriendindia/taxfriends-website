import { supabase } from '../lib/supabase'

export const ReviewService = {
    async getPublicReviews() {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, profiles!inner(full_name, organization)')
            .gte('rating', 3)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getUserReview(userId) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.warn('Supabase Review Search Error:', error.message);
                return null; // Return null if table missing or other err
            }
            return data;
        } catch (e) {
            console.error('getUserReview Exception:', e);
            return null;
        }
    },

    async submitReview(userId, rating, comment) {
        // Check if user already reviewed
        const existing = await this.getUserReview(userId);

        if (existing) {
            const { data, error } = await supabase
                .from('reviews')
                .update({
                    rating,
                    comment,
                    created_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('reviews')
                .insert([{
                    user_id: userId,
                    rating,
                    comment,
                    is_published: true
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }
}
