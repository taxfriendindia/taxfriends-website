import { supabase } from '../lib/supabase'

export const CatalogService = {
    async getAll() {
        const { data, error } = await supabase
            .from('service_catalog')
            .select('*')
            .order('title')
        if (error) throw error

        // Definte priority order
        const priorityOrder = [
            'GST Registration',
            'Income Tax Filing',
            'Accounting & Bookkeeping',
            'Trademark Registration',
            'Food License (FSSAI)',
            'Company Incorporation'
        ]

        // Remove duplicates based on title
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
