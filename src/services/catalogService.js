import { supabase } from '../lib/supabase'

export const CatalogService = {
    async getAll() {
        const { data, error } = await supabase
            .from('service_catalog')
            .select('*')
            .order('created_at', { ascending: false }) // Get newest first for deduplication
        if (error) throw error

        // Define priority order (Top 2 get the "Popular" badge)
        const priorityOrder = [
            'GST Return Filing',
            'Company Incorporation',
            'GST Registration',
            'Income Tax Filing',
            'Accounting & Bookkeeping',
            'Trademark Registration',
            'Food License (FSSAI)'
        ]

        // Remove duplicates based on title (favoring the newest which come first)
        const uniqueServices = data.reduce((acc, current) => {
            const x = acc.find(item => item.title === current.title);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);

        // Sort by priority
        return uniqueServices.sort((a, b) => {
            const indexA = priorityOrder.indexOf(a.title)
            const indexB = priorityOrder.indexOf(b.title)

            // If both are in priority list
            if (indexA !== -1 && indexB !== -1) return indexA - indexB

            // If only A is in priority list
            if (indexA !== -1) return -1

            // If only B is in priority list
            if (indexB !== -1) return 1

            // Neither in priority list, sort alphabetical
            return a.title.localeCompare(b.title)
        })
    }
}
