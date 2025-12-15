import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Scale, Clock, HelpCircle } from 'lucide-react'

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scale className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Guidelines for using TaxFriends services
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2>📝 Service Terms and Conditions</h2>
              <p>
                Welcome to TaxFriends. By using our services, you agree to these terms and conditions. 
                Please read them carefully.
              </p>

              <h3>🎯 Service Scope</h3>
              <p>
                TaxFriends provides tax filing, business registration, and compliance services through 
                our platform and expert team. Our services include but are not limited to:
              </p>
              <ul>
                <li>Income Tax Return (ITR) Filing</li>
                <li>GST Registration and Return Filing</li>
                <li>Company and Business Registration</li>
                <li>MSME/Udyam Registration</li>
                <li>TDS Compliance and Filing</li>
                <li>FSSAI Registration and Compliance</li>
              </ul>

              <h3>✅ Client Responsibilities</h3>
              <ul>
                <li>Provide accurate and complete information for service delivery</li>
                <li>Submit required documents in a timely manner</li>
                <li>Cooperate with our team for additional information when needed</li>
                <li>Make payments as agreed for services rendered</li>
                <li>Keep your contact information updated</li>
              </ul>

              <h3>🛡️ Our Commitments</h3>
              <ul>
                <li>Provide professional and accurate services</li>
                <li>Maintain confidentiality of client information</li>
                <li>Meet agreed-upon timelines for service delivery</li>
                <li>Provide regular updates on service progress</li>
                <li>Offer support and guidance throughout the process</li>
              </ul>

              <h3>⏰ Service Timelines</h3>
              <p>
                Service completion times vary based on the complexity of the service and government 
                processing times. While we strive to complete services promptly, some factors are 
                beyond our control.
              </p>

              <h3>🔒 Data Protection</h3>
              <p>
                We implement robust security measures to protect your data. However, clients are 
                responsible for maintaining the security of their login credentials.
              </p>

              <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <strong>Note:</strong> These terms are subject to change. Continued use of our services 
                  after changes constitutes acceptance of the new terms.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TermsOfService
