import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Clock, FileText, Shield, Users, FileCheck, Calendar, IndianRupee } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const Services = () => {
  const location = useLocation()

  // Scroll to anchor when component loads or hash changes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const element = document.getElementById(id)

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 300)
      }
    }
  }, [location])

  const services = [
    {
      id: 'itr',
      icon: '📝',
      title: 'Income Tax Filing (ITR)',
      description: 'File your Income Tax Returns accurately and claim maximum refunds. Compliant with Indian Income Tax Act.',
      features: [
        'ITR Filing for Individuals & Businesses',
        'Tax Planning & Investment Advisory',
        'NRI Taxation Services',
        'Income Tax Notice Handling',
        'Tax Saving Guidance (80C, 80D, etc.)',
        'Previous Year ITR Analysis'
      ],
      indianInfo: {
        deadline: 'July 31 (Individuals), Oct 31 (Audit Cases)',
        documents: ['PAN Card', 'Aadhaar Card', 'Form 16', 'Bank Statements', 'Investment Proofs'],
        eligibility: 'Income above ₹2.5L, Businesses, NRIs with Indian income',
        benefits: ['Avoid Penalties', 'Claim Refunds', 'Loan Approval', 'Visa Processing']
      }
    },
    {
      id: 'gst',
      icon: '🏢',
      title: 'GST Services',
      description: 'Complete GST compliance including registration, return filing, and input tax credit management.',
      features: [
        'GST Registration (New & Amendment)',
        'GSTR-1, GSTR-3B, GSTR-9 Filing',
        'GST Composition Scheme',
        'E-way Bill Generation',
        'GST Audit & Assessment',
        'Input Tax Credit Reconciliation'
      ],
      indianInfo: {
        deadline: 'Monthly: 11th (GSTR-1), 20th (GSTR-3B)',
        documents: ['PAN Card', 'Business Address Proof', 'Bank Account Details', 'Digital Signature'],
        eligibility: 'Turnover > ₹40L (₹20L for NE States), E-commerce, Inter-state Supply',
        benefits: ['Input Tax Credit', 'Business Credibility', 'Legal Compliance', 'Growth Opportunities']
      }
    },
    {
      id: 'company',
      icon: '🏛️',
      title: 'Company Registration',
      description: 'Register your business as Private Limited, LLP, or One Person Company with complete legal compliance.',
      features: [
        'Private Limited Company Registration',
        'LLP (Limited Liability Partnership)',
        'One Person Company (OPC)',
        'Partnership Firm Registration',
        'Startup India Recognition',
        'NGO/Trust Registration'
      ],
      indianInfo: {
        timeline: '7-15 days depending on company type',
        documents: ['PAN of Directors', 'Address Proof', 'Passport Photos', 'Registered Office Proof'],
        eligibility: 'Indian Residents, NRIs, Foreign Nationals (with conditions)',
        benefits: ['Limited Liability', 'Separate Legal Entity', 'Funding Access', 'Tax Benefits']
      }
    },
    {
      id: 'msme',
      icon: '📈',
      title: 'MSME/Udyam Registration',
      description: 'Get government recognition for your enterprise and access subsidies, loans, and tender benefits.',
      features: [
        'Udyam Registration Certificate',
        'MSME Loan Facilitation',
        'Government Tender Support',
        'Subsidy Application Assistance',
        'ISO Certification Reimbursement',
        'Credit Linked Capital Subsidy'
      ],
      indianInfo: {
        categories: 'Micro (<₹5Cr), Small (<₹50Cr), Medium (<₹250Cr)',
        documents: ['Aadhaar Card', 'PAN Card', 'Business Address Proof'],
        eligibility: 'Manufacturing & Service Enterprises within investment limits',
        benefits: ['Collateral-free Loans', 'Tax Rebates', 'Power Bill Concessions', 'Tender Preference']
      }
    },
    {
      id: 'tds',
      icon: '💰',
      title: 'TDS Filing',
      description: 'Comprehensive TDS compliance including return filing, certificate issuance, and quarterly compliance.',
      features: [
        'TDS Return Filing (24Q, 26Q, 27Q)',
        'Form 16/16A Generation',
        'TDS Assessment Handling',
        'Quarterly e-TDS Compliance',
        'TAN Registration & Management',
        'TDS Default Resolution'
      ],
      indianInfo: {
        deadlines: 'Q1: July 31, Q2: Oct 31, Q3: Jan 31, Q4: May 31',
        documents: ['TAN Number', 'PAN of Deductees', 'Challan Details'],
        applicability: 'Salary Payments, Contract Payments, Rent >₹50K/month, Professional Fees',
        benefits: ['Avoid Penalties', 'Smooth Assessments', 'Compliant Operations', 'Better Business Image']
      }
    },
    {
      id: 'fssai',
      icon: '🍽️',
      title: 'FSSAI Registration',
      description: 'Food license registration mandatory for all food businesses in India under FSS Act 2006.',
      features: [
        'Basic FSSAI Registration',
        'State FSSAI License',
        'Central FSSAI License',
        'License Renewal & Modification',
        'Food Safety Compliance',
        'Import-Export Code Linking'
      ],
      indianInfo: {
        types: 'Basic (<₹12L), State (₹12L-₹20Cr), Central (>₹20Cr)',
        documents: ['Form-B', 'PAN Card', 'Food Safety Plan', 'List of Food Products'],
        applicability: 'Manufacturers, Processors, Restaurants, Hotels, Packers, Importers',
        benefits: ['Legal Requirement', 'Consumer Trust', 'Export Enablement', 'Business Expansion']
      }
    },
    {
      id: 'trademark',
      icon: '®️',
      title: 'Trademark Registration',
      description: 'Protect your brand identity and intellectual property with a registered trademark.',
      features: [
        'Trademark Search & Analysis',
        'Trademark Application Filing',
        'Objection Handling',
        'Trademark Renewal',
        'Copyright Registration',
        'Design Registration'
      ],
      indianInfo: {
        timeline: '1-2 days for filing; 6-12 months for registration',
        documents: ['Brand Logo/Name', 'Identity Proof', 'User Affidavit', 'MSME Certificate (for discount)'],
        eligibility: 'Individuals, Startups, Small Enterprises, Large Corporates',
        benefits: ['Brand Protection', 'Asset Creation', 'Legal Right', 'Global Filing']
      }
    },
    {
      id: 'accounting',
      icon: '📊',
      title: 'Accounting & Bookkeeping',
      description: 'Maintain perfect financial records with our professional accounting and bookkeeping services.',
      features: [
        'Tally/Zoho Books Setup',
        'Monthly Bookkeeping',
        'Bank Reconciliation',
        'Financial Statement Prep',
        'Payment Reminder Service',
        'Inventory Management'
      ],
      indianInfo: {
        frequency: 'Daily/Weekly/Monthly updates',
        documents: ['Bank Statements', 'Purchase Invoices', 'Sales Invoices', 'Expense Vouchers'],
        applicability: 'Startups, SMEs, Retailers, Freelancers',
        benefits: ['Real-time Insights', 'Audit Ready', 'Tax Compliance', 'Better Cash Flow']
      }
    },
    {
      id: 'ngo',
      icon: '🤝',
      title: 'NGO & Trust Registration',
      description: 'Register your non-profit organization as a Trust, Society, or Section 8 Company.',
      features: [
        'Section 8 Company Formation',
        'Trust Deed Registration',
        'Society Registration',
        '12A & 80G Registration',
        'CSR Registration',
        'NITI Aayog Darpan Setup'
      ],
      indianInfo: {
        types: 'Trust (State), Society (State), Section 8 (Central)',
        documents: ['Affidavit of Members', 'Address Proof', 'Aims & Objectives', 'Identity Proofs'],
        eligibility: 'Minimum 3-7 members depending on the entity type',
        benefits: ['Tax Exemptions', 'Government Grants', 'Credibility', 'CSR Funding']
      }
    }
  ]

  const otherServices = [
    { title: 'TAN Registration', category: 'Taxation' },
    { title: 'Digital Signature (DSC)', category: 'Legal' },
    { title: 'Import Export Code (IEC)', category: 'Business' },
    { title: 'ISO Certification', category: 'Quality' },
    { title: 'PAN Card Services', category: 'Personal' },
    { title: 'Professional Tax (PT)', category: 'Taxation' },
    { title: 'Statutory Audit', category: 'Audit' },
    { title: 'Internal Audit', category: 'Audit' },
    { title: 'ROC Compliance', category: 'Corporate' },
    { title: 'DIR-3 KYC', category: 'Directors' },
    { title: 'ESIC & PF Registration', category: 'Labor Law' },
    { title: 'Shop & Establishment', category: 'License' }
  ]

  const serviceFeatures = [
    {
      icon: FileCheck,
      title: 'Expert CA Verification',
      description: 'Every document verified by experienced Indian Chartered Accountants'
    },
    {
      icon: Calendar,
      title: 'Deadline Management',
      description: 'Never miss important due dates with our reminder system'
    },
    {
      icon: Shield,
      title: '100% Compliance',
      description: 'Guaranteed compliance with Indian tax laws and regulations'
    },
    {
      icon: IndianRupee,
      title: 'Cost Effective',
      description: 'Professional services at affordable Indian business prices'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="pt-20">
        {/* Page Header */}
        <section className="bg-white dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Our Complete Service Portfolio
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                From Basic Tax Filing to Complex Business Registrations - Everything You Need for Complete Business Compliance in India
              </p>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  id={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700 p-6 group scroll-mt-24"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Service Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Service Includes:
                    </h4>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Indian Specific Information */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <FileText className="w-5 h-5 text-blue-500 mr-2" />
                      Documents Required:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {service.indianInfo.documents.join(', ')}
                    </p>

                    {service.indianInfo.deadline && (
                      <div className="mt-2">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">Deadlines:</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{service.indianInfo.deadline}</p>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Key Benefits:</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.indianInfo.benefits.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/contact"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center space-x-2 group/link"
                  >
                    <span>🚀 Get Started</span>
                    <ArrowRight size={20} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Miscellaneous Services */}
        <section className="py-20 bg-gray-100 dark:bg-gray-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Other Important Services</h2>
              <p className="text-gray-600 dark:text-gray-400">Need something else? We cover almost every business & tax need in India.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {otherServices.map((service, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between group hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{service.title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{service.category}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Missing Service CTA */}
        <section className="py-16 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-10 rounded-3xl border border-dashed border-blue-200 dark:border-blue-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Missing a Service?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto text-lg italic">
                "Our portfolio is vast, and we handle many custom requests for startups and NRIs. If you can't find what you need, our CA experts are just a message away."
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Inquire About Custom Service <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us for Indian Businesses */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Why Indian Businesses Trust Apna TaxFriend?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                We understand the unique challenges faced by Indian businesses and provide tailored solutions
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {serviceFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Start Your Business Journey in India?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Our experts understand Indian regulations and will guide you through every step
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  💬 Talk to Our CA Expert
                </Link>
                <a
                  href="tel:8409847102"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  📞 Get Free Consultation
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div >
  )
}

export default Services