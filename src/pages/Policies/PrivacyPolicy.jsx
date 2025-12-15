import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, FileText } from 'lucide-react'

const PrivacyPolicy = () => {
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
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              How we protect and handle your data at TaxFriends
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Data Security</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank-level encryption</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Eye className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Transparency</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clear data usage</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Compliance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">GDPR & Indian Laws</p>
                </div>
              </div>

              <h2>🔒 Data Collection and Usage</h2>
              <p>
                At TaxFriends, we are committed to protecting your privacy and ensuring the security of your personal 
                and business information. This policy outlines how we collect, use, and protect your data.
              </p>

              <h3>📋 Information We Collect</h3>
              <ul>
                <li><strong>Personal Information:</strong> Name, email, phone number, address</li>
                <li><strong>Business Information:</strong> Company details, GSTIN, PAN, business documents</li>
                <li><strong>Service Data:</strong> Information related to the services you avail from us</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
              </ul>

              <h3>🎯 How We Use Your Information</h3>
              <ul>
                <li>To provide and manage our tax and compliance services</li>
                <li>To communicate with you about your service requirements</li>
                <li>To improve our services and user experience</li>
                <li>To comply with legal and regulatory requirements</li>
                <li>To send important updates and service notifications</li>
              </ul>

              <h3>🛡️ Document Security Measures</h3>
              <p>
                We implement bank-level security measures to protect your documents:
              </p>
              <ul>
                <li>End-to-end encryption for all document transfers</li>
                <li>Secure cloud storage with access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Secure data destruction when no longer needed</li>
              </ul>

              <h3>🤝 Client Confidentiality</h3>
              <p>
                We maintain strict client confidentiality and do not share your information with third parties 
                except as required for service delivery or by law. All our team members sign confidentiality 
                agreements and undergo security training.
              </p>

              <h3>📞 Contact Us</h3>
              <p>
                If you have any questions about our privacy policy or how we handle your data, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p>Email: taxfriend.gst@gmail.com</p>
                <p>Phone: 8409847102</p>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Last Updated:</strong> January 2024<br />
                  We may update this policy from time to time. Please check back periodically for changes.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
