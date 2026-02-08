import React from 'react'
import Header from './Header'
import Footer from './Footer'
import AdContainer from '../Shared/AdContainer'
import AdScriptManager from '../Shared/AdScriptManager'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <AdScriptManager />
      <Header />
      <main className="pt-16">
        {/* Global Top Ad Slot */}
        <AdContainer slotId="global-top-banner" className="mt-4" label="Sponsor" />
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
