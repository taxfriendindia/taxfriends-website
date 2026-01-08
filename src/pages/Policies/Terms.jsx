import React from 'react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const Terms = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-32">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
                <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
                        <p>By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Services</h2>
                        <p>Apna TaxFriend provides tax filing and business registration services. All services are subject to the acceptance of your documentation and compliance with government regulations.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. User Responsibilities</h2>
                        <p>You are responsible for providing accurate and complete information. We are not liable for any penalties resulting from incorrect data provided by you.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Privacy</h2>
                        <p>Your use of the service is also governed by our Privacy Policy.</p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Terms
