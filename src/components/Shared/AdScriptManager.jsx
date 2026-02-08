import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AdScriptManager = () => {
    const { user, loading } = useAuth()
    const location = useLocation()

    useEffect(() => {
        // 1. Safety Check: Don't do anything while auth is loading
        if (loading) return

        // 2. Auth Check: If user is logged in, DO NOT load ads
        if (user) {
            removeAdScripts()
            return
        }

        // 3. Route Check: Define protected paths pattern
        // Block ads on: /dashboard, /admin, /client, /login (optional but good UX)
        const protectedPaths = ['/dashboard', '/admin', '/client', '/login']
        const isProtectedRoute = protectedPaths.some(path => location.pathname.startsWith(path))

        if (isProtectedRoute) {
            removeAdScripts()
            return
        }

        // 4. Load Ads if safe
        loadMonetagScript()

    }, [user, loading, location.pathname])

    const loadMonetagScript = () => {
        // Prevent duplicate scripts
        if (document.getElementById('monetag-vignette')) return

        const script = document.createElement('script')
        script.id = 'monetag-vignette'
        script.async = true
        script.dataset.cfasync = "false"

        // The actual ad script wrapper
        script.innerHTML = `
      (function(s){
        s.dataset.zone='10584548';
        s.src='https://gizokraijaw.net/vignette.min.js';
      })(document.createElement('script'))
    `

        // Error handling
        script.onerror = () => {
            console.warn('Ad script failed to load')
            script.remove()
        }

        // Append to body
        // We append a new script element that *contains* the IIFE from Monetag
        // NOTE: The Monetag snippet creates *another* script element. 
        // To implement faithfully to their snippet but safely:

        try {
            const adScript = document.createElement('script');
            adScript.id = 'monetag-loader';
            adScript.innerHTML = `(function(s){s.dataset.zone='10584548',s.src='https://gizokraijaw.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`;
            document.body.appendChild(adScript);
        } catch (e) {
            console.error("Ad injection error", e);
        }
    }

    const removeAdScripts = () => {
        // Remove the loader script we added
        const loader = document.getElementById('monetag-loader')
        if (loader) loader.remove()

        // Remove the actual script injected by the loader if possible (harder since it's dynamic)
        // We can try to find scripts with specific src
        const scripts = document.querySelectorAll('script[src*="gizokraijaw.net"]')
        scripts.forEach(s => s.remove())

        // Also clean up any potential ad containers or styles injected by the ad script if known
    }

    return null // Headless component
}

export default AdScriptManager
