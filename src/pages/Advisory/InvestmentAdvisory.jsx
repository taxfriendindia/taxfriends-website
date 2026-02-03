import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShieldAlert, Rocket, Target, Linkedin, ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Shared/Navbar';
import Footer from '../../components/Shared/Footer';

const InvestmentAdvisory = () => {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white dark:bg-gray-900 pt-32 pb-20 overflow-hidden relative">
                {/* Background elements */}
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-700 dark:text-indigo-300 font-bold text-sm uppercase tracking-widest mb-6"
                        >
                            <TrendingUp size={16} />
                            <span>Exclusive Advisory Collective</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7 }}
                            className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight"
                        >
                            Grow Your Wealth with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-900 dark:from-indigo-400 dark:to-indigo-200">The Power of Community</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-medium"
                        >
                            Connecting ambitious individual investors with a team of seasoned market experts. We help you navigate the complexities of portfolio growth through shared wisdom and elite strategies.
                        </motion.p>
                    </div>

                    {/* Warning Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="mb-20 p-8 bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-[2.5rem] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldAlert size={120} className="text-rose-600" />
                        </div>

                        <div className="flex items-start space-x-6 relative z-10">
                            <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-500/20 shrink-0">
                                <ShieldAlert size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-900 dark:text-rose-400 mb-2 uppercase tracking-tight">Crucial Advisory Note</h3>
                                <p className="text-rose-800 dark:text-rose-300 text-lg font-bold leading-relaxed">
                                    Investments are subject to high market risks. Our advisory collective provides strategies and expert opinions, but final results are never guaranteed. Past success does not predict future returns. Connect with caution and transparency.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        <AdvisoryFeature
                            icon={<Users size={28} />}
                            title="Like-Minded Network"
                            desc="Connect with high-net-worth individuals and serious portfolio builders in an exclusive social circle."
                        />
                        <AdvisoryFeature
                            icon={<Target size={28} />}
                            title="Expert Strategies"
                            desc="Gain access to blue-chip strategies and niche market opportunities vetted by professional analysts."
                        />
                        <AdvisoryFeature
                            icon={<Rocket size={28} />}
                            title="Exponential Growth"
                            desc="Focused on long-term wealth creation by compounding knowledge and capital through elite networking."
                        />
                    </div>

                    {/* Information Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-indigo-100 dark:border-gray-700 p-10 md:p-20 shadow-2xl relative">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
                                    This is not a service. <br />
                                    <span className="text-indigo-600">This is an alliance.</span>
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 font-medium leading-relaxed">
                                    TaxFriend India primarily focuses on compliance and taxation. However, we understand that for many of our clients, managing tax is just one side of the coin. The other side is growing the portfolio that needs to be taxed.
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-lg mb-10 font-medium leading-relaxed">
                                    We've partnered with an elite team of external experts to help our community members connect with the right people for investment advisory. If you have the intent to scale, we have the network.
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    <a
                                        href="https://wa.me/918409847102?text=Hi, I am interested in joining the Investment Advisory Collective."
                                        target="_blank"
                                        className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all flex items-center group"
                                    >
                                        Connect on WhatsApp <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                                    </a>
                                    <Link
                                        to="/contact"
                                        className="px-10 py-5 bg-white dark:bg-gray-700 border-2 border-indigo-100 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all "
                                    >
                                        Enquire Now
                                    </Link>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-800 rounded-[2.5rem] p-8 text-white relative z-10 overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 p-8 opacity-20">
                                        <TrendingUp size={160} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Portfolio Statistics</h3>
                                    <div className="space-y-6">
                                        <StatItem label="Expert Wisdom" val="100%" />
                                        <StatItem label="Transparency" val="Full" />
                                        <StatItem label="Community Support" val="Active" />
                                        <StatItem label="Investment Focus" val="Growth" />
                                    </div>
                                    <div className="mt-10 p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                                        <p className="text-sm font-bold opacity-90 italic">
                                            "Networking is not just about connecting people. It's about connecting people with people, people with ideas, and people with opportunities."
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-indigo-100 dark:border-indigo-900/50 rounded-[2.5rem] -z-10 translate-x-3 translate-y-3"></div>
                            </div>
                        </div>
                    </div>

                    {/* Final Connect CTA */}
                    <div className="mt-20 text-center">
                        <p className="text-gray-500 dark:text-gray-400 font-black text-xs uppercase tracking-[0.3em] mb-4">Start your journey today</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-8">Ready to evolve your investment strategy?</h3>
                        <div className="flex justify-center space-x-6">
                            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold">
                                <Info size={18} />
                                <span>No Entry Fee for Community</span>
                            </div>
                            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold">
                                <Info size={18} />
                                <span>Vetted Strategies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

const AdvisoryFeature = ({ icon, title, desc }) => (
    <motion.div
        whileHover={{ y: -10 }}
        className="p-8 bg-white dark:bg-gray-800 border-2 border-indigo-100/50 dark:border-indigo-900/30 rounded-[2.5rem] shadow-xl shadow-indigo-500/5"
    >
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 border border-indigo-100 dark:border-indigo-800">
            {icon}
        </div>
        <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{title}</h4>
        <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{desc}</p>
    </motion.div>
);

const StatItem = ({ label, val }) => (
    <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <span className="text-sm font-bold opacity-80">{label}</span>
        <span className="text-xl font-black">{val}</span>
    </div>
);

export default InvestmentAdvisory;
