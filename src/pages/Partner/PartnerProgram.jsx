import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ShieldCheck, Zap, ArrowRight, CheckCircle2, Building2, Wallet2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Shared/Navbar';
import Footer from '../../components/Shared/Footer';

const PartnerProgram = () => {
    const benefits = [
        {
            icon: TrendingUp,
            title: "Recurring Royalty",
            description: "Earn commission on every service request from your clients, even if they log in directly later."
        },
        {
            icon: Zap,
            title: "Quick Processing",
            description: "Get your royalties processed within 3 days of service completion and verification."
        },
        {
            icon: Building2,
            title: "Business Expansion",
            description: "Offer professional tax and business compliance services to your existing customers."
        },
        {
            icon: ShieldCheck,
            title: "Trust & Security",
            description: "Backed by professional experts and secure data handling for all your clients."
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Register & Connect",
            description: "Sign up and contact our team to express your interest in the partnership."
        },
        {
            number: "02",
            title: "KYC Verification",
            description: "Complete your identity verification to ensure a secure partnership ecosystem."
        },
        {
            number: "03",
            title: "Get Partner Access",
            description: "Our team promotes your profile to 'City Partner' and unlocks your dashboard."
        },
        {
            number: "04",
            title: "Start Earning",
            description: "Onboard clients, manage requests, and track your wallet balance in real-time."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600/5 -z-10 blur-3xl opacity-50" />
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold mb-6"
                    >
                        <Users size={16} />
                        <span>Join the TaxFriends Network</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight"
                    >
                        Grow Your Business as a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">City Partner</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10"
                    >
                        Become a franchise partner and earn royalties by onboarding clients to professional tax and business services. Empower your local shop or service center.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/contact" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center">
                            Contact for Partnership <ArrowRight size={20} className="ml-2" />
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                            Sign Up as Client First
                        </Link>
                    </motion.div>
                </div>
            </header>

            {/* Benefits Content */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Become a Partner?</h2>
                        <p className="text-gray-500">Scale your income with professional support and recurring commissions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group"
                            >
                                <div className="w-14 h-14 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <benefit.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Onboarding Journey</h2>
                        <p className="text-gray-500">Four simple steps to start your professional journey with us.</p>
                    </div>

                    <div className="space-y-6">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm"
                            >
                                <div className="text-4xl font-black text-blue-600/20 dark:text-blue-400/10 min-w-[70px]">
                                    {step.number}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                                </div>
                                <div className="ml-auto hidden sm:block">
                                    <CheckCircle2 size={24} className="text-gray-200 dark:text-gray-700" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Royalty Calc Summary */}
            <section className="py-20 bg-blue-600">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="max-w-3xl mx-auto text-white">
                        <Wallet2 size={48} className="mx-auto mb-6 opacity-80" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 italic">Earn Direct Commissions ₹300 - ₹500 per Service</h2>
                        <p className="text-blue-100 mb-10 text-lg">
                            Whether you upload client documents directly or your referred clients use our services later, you earn. Our transparent wallet system keeps you in control.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <div className="text-2xl font-bold">₹300 - ₹500</div>
                                <div className="text-xs font-medium uppercase tracking-wider text-blue-200">Commission Per Client</div>
                            </div>
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <div className="text-2xl font-bold">3 Days</div>
                                <div className="text-xs font-medium uppercase tracking-wider text-blue-200">Payout Process</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Form Support */}
            <section className="py-20">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <MessageSquare size={48} className="mx-auto mb-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Have Questions? Talk to our Team.</h2>
                    <p className="text-gray-500 mb-10 leading-relaxed">
                        We are looking for dedicated partners across Indian cities to expand our network. Our team will guide you through the process and help you maximize your income potential.
                    </p>
                    <Link to="/contact" className="inline-flex items-center space-x-2 px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 border border-blue-600 rounded-2xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                        <span>Message on WhatsApp / Email</span>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PartnerProgram;
