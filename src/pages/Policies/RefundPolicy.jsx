import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, XCircle, CheckCircle, Clock } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const RefundPolicy = () => {
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
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Refund & Cancellation Policy
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Our policy on refunds and service cancellations
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 md:p-12">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm">1</span>
                Refund Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                At Apna TaxFriend, we strive to provide the best service experience. If you are not satisfied
                with our services, here's our refund policy:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Full Refund Eligible</h3>
                  </div>
                  <ul className="text-sm text-emerald-700/80 dark:text-emerald-400/80 space-y-2 list-none p-0">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Service not initiated within 7 days
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Technical error from our side
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Service not delivered as promised
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] border border-rose-100 dark:border-rose-900/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    <h3 className="font-bold text-rose-800 dark:text-rose-300">No Refund</h3>
                  </div>
                  <ul className="text-sm text-rose-700/80 dark:text-rose-400/80 space-y-2 list-none p-0">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      Service work has started
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      Government fees paid
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      Documents submitted to authorities
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-8 text-gray-600 dark:text-gray-300">
                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Processing Time</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                      <Clock size={24} />
                    </div>
                    <p className="font-medium m-0">Refund requests are processed within <span className="text-blue-600 font-bold">7-10 business days</span>. The amount will be credited to the original payment method.</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">2</span>
                    Cancellation Policy
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Before service initiation', status: 'Full refund available' },
                      { label: 'After service initiation', status: 'Case-by-case evaluation' },
                      { label: 'After government submission', status: 'Non-refundable' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                        <span className="font-bold">{item.label}</span>
                        <span className="text-sm font-medium px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How to Request</h3>
                  <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/30 transition-all" />
                    <p className="relative z-10 font-medium mb-6">To request a refund or cancellation, please contact our support team:</p>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-8">
                      <div>
                        <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Email Support</p>
                        <p className="font-bold">taxfriend.gst@gmail.com</p>
                      </div>
                      <div>
                        <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Helpline</p>
                        <p className="font-bold">+91 8409847102</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default RefundPolicy
