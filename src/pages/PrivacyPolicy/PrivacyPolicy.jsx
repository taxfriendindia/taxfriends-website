import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, FileText, Globe, Scale, ChevronDown, CheckCircle, AlertTriangle, Eye, UserCheck } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const PrivacyPolicy = () => {
    // SEO setup
    useEffect(() => {
        document.title = "Privacy Policy - TaxFriends Data Protection"
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Header */}
                <div className="max-w-4xl mx-auto px-6 mb-16 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 mb-6">
                            <Shield size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                            How TaxFriends protects your data. Your trust is our most valuable asset.
                        </p>
                        <div className="mt-6 text-sm text-gray-500 dark:text-gray-500 font-medium bg-white dark:bg-gray-800 inline-block px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                            Effective Date: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </div>
                    </motion.div>
                </div>

                <div className="max-w-4xl mx-auto px-6 space-y-12">

                    {/* 1. Introduction */}
                    <Section
                        title="1. Introduction"
                        icon={FileText}
                        content="At TaxFriends, we understand that your financial and business information is sensitive and confidential. This Privacy Policy explains how we collect, use, disclose, and protect your personal data when you use our services. We are committed to transparency and security in every interaction."
                    />

                    {/* 2. Information We Collect */}
                    <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 mr-4">
                                <Eye size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Information We Collect</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3">Personal Information</h3>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                    {['Full Name & Contact Details', 'Business Name & Details', 'Government IDs (PAN, Aadhaar)', 'Bank Account Details'].map((item, i) => (
                                        <li key={i} className="flex items-center"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></div>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white border-l-4 border-purple-500 pl-3">Service & Technical Data</h3>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                    {['Tax Filing Data & History', 'Financial Statements', 'IP Address & Device Info', 'Usage Patterns'].map((item, i) => (
                                        <li key={i} className="flex items-center"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. How We Use Your Info */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: 'Service Delivery', icon: CheckCircle, desc: 'Provide tax filing & compliance solutions.', color: 'text-green-600 bg-green-50' },
                            { title: 'Security & Verification', icon: Shield, desc: 'Prevent fraud & verify identity.', color: 'text-blue-600 bg-blue-50' },
                            { title: 'Legal Compliance', icon: Scale, desc: 'Comply with tax laws & regulations.', color: 'text-red-600 bg-red-50' },
                        ].map((card, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.color.replace('text-', 'bg-opacity-20 ')}`}>
                                    <card.icon className={card.color.split(' ')[0]} size={24} />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{card.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* 4. Security Measures */}
                    <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-8 flex items-center">
                                <Lock className="mr-3 text-green-400" /> 4. Bank-Level Security Measures
                            </h2>
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                                    <h3 className="font-bold text-lg text-green-400 mb-2">Encryption</h3>
                                    <p className="text-sm text-gray-300">256-bit SSL encryption for data transmission and AES-256 for stored documents.</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                                    <h3 className="font-bold text-lg text-blue-400 mb-2">Access Control</h3>
                                    <p className="text-sm text-gray-300">Role-based access, MFA for admins, and strict activity logging.</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                                    <h3 className="font-bold text-lg text-purple-400 mb-2">Secure Storage</h3>
                                    <p className="text-sm text-gray-300">Geo-redundant cloud servers with regular security audits.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 5. Data Sharing (Accordion Style) */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Sharing & Disclosure</h2>
                        <Accordion title="Who we DO NOT share with">
                            <div className="text-red-600 font-medium flex items-center space-x-2">
                                <AlertTriangle size={18} /> <span>Third-party marketers, Data brokers, Unauthorized personnel.</span>
                            </div>
                        </Accordion>
                        <Accordion title="Who we MAY share with (Strictly Necessary)">
                            <div className="text-green-600 font-medium flex items-center space-x-2">
                                <CheckCircle size={18} /> <span>Government authorities (Tax Laws), Financial institutions (Refunds), Trusted partners (under NDA).</span>
                            </div>
                        </Accordion>
                    </div>

                    {/* 6 to 14 Combined Sections for Readability */}
                    {/* 6 to 10 Collapsible Sections */}
                    <div className="space-y-4">
                        <Accordion title="6. Your Rights">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                You have the right to access your data, request corrections, delete personal information (subject to legal retention), and opt-out of marketing communications.
                            </p>
                        </Accordion>

                        <Accordion title="7. Data Retention">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                We retain active client data for 7 years and financial records for 10 years as per tax laws. Inactive data is securely deleted after 2 years.
                            </p>
                        </Accordion>

                        <Accordion title="8. Cookies Policy">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                We use essential cookies for site functionality and anonymous analytics cookies to improve user experience. You can manage these in your browser settings.
                            </p>
                        </Accordion>

                        <Accordion title="9. Breach Protocol">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                In the unlikely event of a breach, we follow a strict protocol: Immediate Containment → Investigation → Notification within 72 hours → Remediation.
                            </p>
                        </Accordion>

                        <Accordion title="10. International Transfers">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Your data is primarily stored on secure servers within India. Any backups follow international security standards.
                            </p>
                        </Accordion>
                    </div>

                    {/* Contact for Privacy */}
                    <section className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-8 md:p-12 text-center border border-blue-100 dark:border-blue-900/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Questions about your privacy?</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
                            Contact our Data Protection Officer for any concerns regarding your personal information.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                            <a href="mailto:taxfriend.tax@gmail.com" className="flex items-center text-blue-600 font-bold hover:underline bg-white dark:bg-gray-800 px-6 py-3 rounded-xl shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">@</div>
                                taxfriend.tax@gmail.com
                            </a>
                            <a href="tel:8409847102" className="flex items-center text-gray-700 dark:text-gray-200 font-bold hover:text-blue-600 transition-colors">
                                Call DPO: +91 8409847102
                            </a>
                        </div>
                    </section>

                </div>
            </main>
            <Footer />
        </div>
    )
}

// Sub-components for cleaner code
const Section = ({ title, content, icon: Icon }) => (
    <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700"
    >
        <div className="flex items-start">
            {Icon && <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 mr-5 flex-shrink-0"><Icon size={24} /></div>}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{content}</p>
            </div>
        </div>
    </motion.section>
)

const SectionBlock = ({ title, content }) => (
    <div className="pt-8 first:pt-0">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{content}</p>
    </div>
)

const Accordion = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-5 font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
                {title}
                <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <div className="p-5 pt-0 border-t border-gray-100 dark:border-gray-700/50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default PrivacyPolicy
