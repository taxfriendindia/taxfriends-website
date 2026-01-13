import React from 'react'
import { motion } from 'framer-motion'
import { Truck, Globe, Clock, CheckCircle } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const ShippingPolicy = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Truck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                            Shipping & Delivery Policy
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400">
                            Information about service delivery and timelines
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 md:p-12">
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">1</span>
                                Digital Service Delivery
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                                TaxFriend India primarily provides professional tax and compliance consulting services. All our services are delivered digitally through our online portal, email, or other electronic communication channels.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-900/50">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        <h3 className="font-bold text-blue-800 dark:text-blue-300">Delivery Method</h3>
                                    </div>
                                    <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
                                        Completed service documents (acknowledgments, certificates, reports) are uploaded to your client dashboard and sent via email. No physical shipping is required for these digital products.
                                    </p>
                                </div>

                                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/50">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Delivery Timelines</h3>
                                    </div>
                                    <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
                                        Timelines vary by service (e.g., GST: 3-5 days, ITR: 1-2 days). Actual delivery depends on government processing times and document accuracy.
                                    </p>
                                </div>
                            </div>

                            <section className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">General Terms</h3>
                                <ul className="space-y-4 list-none p-0">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-blue-500 shrink-0 mt-1" />
                                        <span className="text-gray-600 dark:text-gray-300">Services are deemed "delivered" once the final documents are shared or the service request is marked as completed on the portal.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-blue-500 shrink-0 mt-1" />
                                        <span className="text-gray-600 dark:text-gray-300">TaxFriend India is not responsible for delays caused by government server outages or technical issues at the department level.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-blue-500 shrink-0 mt-1" />
                                        <span className="text-gray-600 dark:text-gray-300">Clients will be notified of any significant delays in the service delivery process.</span>
                                    </li>
                                </ul>
                            </section>

                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-400 font-medium italic">
                                    Last Updated: January 13, 2026 • TaxFriend India Service Team
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    )
}

export default ShippingPolicy
