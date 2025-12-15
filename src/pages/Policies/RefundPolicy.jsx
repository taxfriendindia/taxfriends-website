import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, XCircle, CheckCircle, Clock } from 'lucide-react'

const RefundPolicy = () => {
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
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Refund & Cancellation Policy
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Our policy on refunds and service cancellations
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2>🔄 Refund Policy</h2>
              <p>
                At TaxFriends, we strive to provide the best service experience. If you are not satisfied 
                with our services, here's our refund policy:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Full Refund Eligible</h3>
                  </div>
                  <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                    <li>• Service not initiated within 7 days</li>
                    <li>• Technical error from our side</li>
                    <li>• Service not delivered as promised</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-red-800 dark:text-red-300">No Refund</h3>
                  </div>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    <li>• Service work has started</li>
                    <li>• Government fees paid</li>
                    <li>• Documents submitted to authorities</li>
                  </ul>
                </div>
              </div>

              <h3>⏰ Processing Time</h3>
              <p>
                Refund requests are processed within 7-10 business days. The amount will be credited 
                to the original payment method.
              </p>

              <h2>❌ Cancellation Policy</h2>
              <p>
                Service cancellations are accepted under the following conditions:
              </p>
              <ul>
                <li><strong>Before service initiation:</strong> Full refund available</li>
                <li><strong>After service initiation:</strong> Case-by-case evaluation</li>
                <li><strong>After government submission:</strong> Non-refundable</li>
              </ul>

              <h3>📞 How to Request</h3>
              <p>
                To request a refund or cancellation, contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p>Email: taxfriend.gst@gmail.com</p>
                <p>Phone: 8409847102</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Include your service details and reason for refund request.
                </p>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Government fees and third-party charges are non-refundable once paid. 
                  Service charges are refundable based on the above conditions.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RefundPolicy
