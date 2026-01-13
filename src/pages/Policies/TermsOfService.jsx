import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Scale, Clock, CheckCircle } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const TermsOfService = () => {
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
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scale className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Guidelines for using TaxFriend India services
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 md:p-12">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">1</span>
                Service Terms and Conditions
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Welcome to TaxFriend India. By using our services, you agree to these terms and conditions.
                Please read them carefully.
              </p>

              <div className="space-y-12">
                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Service Scope</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      'Income Tax Return (ITR) Filing',
                      'GST Registration and Returns',
                      'Company & Firm Registration',
                      'MSME/Udyam Registration',
                      'TDS Compliance and Filing',
                      'FSSAI Registration'
                    ].map((service, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                        <CheckCircle size={18} className="text-emerald-500" />
                        <span className="font-semibold text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Client Responsibilities</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                    <ul className="space-y-4 list-none p-0 m-0">
                      {[
                        'Provide accurate and complete info',
                        'Submit required documents on time',
                        'Cooperate with our experts',
                        'Clear payments for services rendered',
                        'Keep contact details updated'
                      ].map((text, i) => (
                        <li key={i} className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-xs font-black">{i + 1}</div>
                          <span className="font-medium">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Our Commitments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm">
                      <h4 className="font-bold text-emerald-600 mb-2">Professionalism</h4>
                      <p className="text-sm">Provide professional and accurate services with expert oversight.</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm">
                      <h4 className="font-bold text-emerald-600 mb-2">Confidentiality</h4>
                      <p className="text-sm">Maintain strict confidentiality of all client data and documents.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 italic">Security Note</h3>
                  <div className="p-6 bg-emerald-600 text-white rounded-[2rem] shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                    <Scale className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
                    <p className="relative z-10 m-0 font-medium">
                      We implement robust security measures to protect your data. However, clients are
                      responsible for maintaining the security of their account credentials.
                    </p>
                  </div>
                </section>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                    <Clock size={12} />
                    Last Updated: January 13, 2026 • TaxFriend India Legal Team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default TermsOfService
