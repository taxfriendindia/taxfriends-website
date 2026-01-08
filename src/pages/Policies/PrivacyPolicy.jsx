import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, FileText, CheckCircle, Clock } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const PrivacyPolicy = () => {
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
              <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              How we protect and handle your data at Apna TaxFriend
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 md:p-12">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/50">
                  <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Data Security</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bank-level encryption</p>
                </div>
                <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                  <Eye className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Transparency</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clear data usage</p>
                </div>
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-3xl border border-purple-100 dark:border-purple-900/50">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Compliance</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">GDPR & Indian Laws</p>
                </div>
              </div>

              <div className="space-y-8 text-gray-600 dark:text-gray-300">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">1</span>
                    Data Collection and Usage
                  </h2>
                  <p>
                    At Apna TaxFriend, we are committed to protecting your privacy and ensuring the security of your personal
                    and business information. This policy outlines how we collect, use, and protect your data.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Information We Collect</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                    <li className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex items-start gap-3 italic">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                      <div><strong>Personal Information:</strong> Name, email, phone number, address</div>
                    </li>
                    <li className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex items-start gap-3 italic">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                      <div><strong>Business Information:</strong> Company details, GSTIN, PAN, business documents</div>
                    </li>
                    <li className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex items-start gap-3 italic">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                      <div><strong>Service Data:</strong> Information related to the services you avail from us</div>
                    </li>
                    <li className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex items-start gap-3 italic">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                      <div><strong>Technical Data:</strong> IP address, browser type, device information</div>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How We Use Your Information</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                    <ul className="space-y-3 list-none p-0 m-0">
                      <li className="flex items-center gap-3">
                        <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                        <span>To provide and manage our tax and compliance services</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                        <span>To communicate with you about your service requirements</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                        <span>To improve our services and user experience</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                        <span>To comply with legal and regulatory requirements</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Document Security Measures</h3>
                  <p className="mb-4">We implement bank-level security measures to protect your documents:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
                      <h4 className="font-bold text-blue-600 mb-2">Encryption</h4>
                      <p className="text-sm">End-to-end encryption for all document transfers</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
                      <h4 className="font-bold text-blue-600 mb-2">Access Control</h4>
                      <p className="text-sm">Secure cloud storage with restricted access</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h3>
                  <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/30 transition-all" />
                    <p className="relative z-10 font-medium mb-4">If you have any questions about our privacy policy or how we handle your data, please contact us:</p>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-6">
                      <div>
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Support Email</p>
                        <p className="font-bold">taxfriend.gst@gmail.com</p>
                      </div>
                      <div>
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Helpline</p>
                        <p className="font-bold">+91 8409847102</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                    <Clock size={12} />
                    Last Updated: January 08, 2026 • Apna TaxFriend Compliance Team
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

export default PrivacyPolicy
