import { useLocation } from 'react-router-dom'

/**
 * Hook to detect if current page is public (should show ads)
 * Returns true for public pages, false for admin/client pages
 */
export const useIsPublicPage = () => {
    const location = useLocation()
    const pathname = location.pathname

    // Public pages that should show ads
    const publicRoutes = [
        '/',
        '/services',
        '/about',
        '/contact',
        '/advisory',
        '/portfolio',
        '/privacy-policy',
        '/terms',
        '/terms-of-service',
        '/refund-policy',
        '/shipping-policy'
    ]

    // Check if current path is public
    if (publicRoutes.includes(pathname)) {
        return true
    }

    // Block ads on admin and client portals
    if (pathname.startsWith('/admin') ||
        pathname.startsWith('/dashboard') ||
        pathname === '/login') {
        return false
    }

    // Default to showing ads on other public pages
    return true
}
