import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const ScrollToAnchor = () => {
    const location = useLocation()

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '')
            const element = document.getElementById(id)

            if (element) {
                // Small delay to ensure page is loaded
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    })
                }, 100)
            }
        }
    }, [location])

    return null
}

export default ScrollToAnchor