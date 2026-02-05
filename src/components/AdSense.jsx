import { useEffect } from 'react'

/**
 * Google AdSense Component
 * 
 * Usage:
 * <AdSense 
 *   adSlot="YOUR_AD_SLOT_ID"
 *   adFormat="auto"
 *   fullWidthResponsive={true}
 * />
 */
const AdSense = ({
    adSlot = '',
    adFormat = 'auto',
    fullWidthResponsive = true,
    className = ''
}) => {
    useEffect(() => {
        try {
            // Push ad to AdSense
            if (window.adsbygoogle && adSlot) {
                ; (window.adsbygoogle = window.adsbygoogle || []).push({})
            }
        } catch (err) {
            console.error('AdSense error:', err)
        }
    }, [adSlot])

    // Don't show ads if no slot ID provided
    if (!adSlot) {
        return null
    }

    return (
        <div className={`adsense-container ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-2044774047242628"
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive={fullWidthResponsive.toString()}
            />
        </div>
    )
}

export default AdSense
