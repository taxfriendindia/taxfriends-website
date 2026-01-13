import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    Mail, Phone, MapPin, Linkedin, Globe,
    Award, Briefcase, GraduationCap, CheckCircle2,
    TrendingUp, Users, ShieldCheck, FileText,
    Star, ExternalLink, MessageSquare, Calendar,
    ArrowRight, Zap, Heart, Search
} from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const TypewriterText = ({ words }) => {
    const [index, setIndex] = useState(0)
    const [subIndex, setSubIndex] = useState(0)
    const [reverse, setReverse] = useState(false)
    const [blink, setBlink] = useState(true)

    // Typewriter effect
    useEffect(() => {
        if (index === words.length) return

        if (subIndex === words[index].length + 1 && !reverse) {
            setTimeout(() => setReverse(true), 2000)
            return
        }

        if (subIndex === 0 && reverse) {
            setReverse(false)
            setIndex((prev) => (prev + 1) % words.length)
            return
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1))
        }, Math.max(reverse ? 75 : subIndex === words[index].length ? 1000 : 150, parseInt(Math.random() * 100)))

        return () => clearTimeout(timeout)
    }, [subIndex, index, reverse, words])

    // Blinking cursor
    useEffect(() => {
        const timeout2 = setTimeout(() => {
            setBlink((prev) => !prev)
        }, 500)
        return () => clearTimeout(timeout2)
    }, [blink])

    return (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
            {` ${words[index].substring(0, subIndex)}`}
            <span className={`${blink ? 'opacity-100' : 'opacity-0'} inline-block w-1 h-8 md:h-12 lg:h-16 bg-emerald-500 ml-1 align-middle`}></span>
        </span>
    )
}

const PortfolioExpert = () => {
    const navigate = useNavigate()
    const portfolioRef = useRef(null)

    useEffect(() => {
        document.title = "Know Your Expert | Bablu Kumar - Expert Tax Advisor"
        window.scrollTo(0, 0)
    }, [])

    const scrollToPortfolio = () => {
        portfolioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const journeyRef = useRef(null)
    const { scrollYProgress: journeyProgress } = useScroll({
        target: journeyRef,
        offset: ["start center", "end center"]
    })

    const carMove = useTransform(journeyProgress, [0, 1], ["0%", "100%"])

    const stats = [
        { label: "Years Experience", value: "10+", icon: Calendar },
        { label: "Happy Clients", value: "500+", icon: Users },
        { label: "Tax Reduction", value: "20%", icon: TrendingUp },
        { label: "Audit Success", value: "100%", icon: ShieldCheck },
    ]

    const portfolioItems = [
        {
            title: "Uniclips Studio Pvt Ltd",
            logo: "/images/clients/uniclips.png",
            website: "https://uniclipsstudio.com/business/",
            category: "Media & Production",
            location: "Karnal, Haryana",
            description: "End-to-end financial oversight, multi-state production accounting, and tax compliance. Streamlined complex bookkeeping to ensure audit-readiness.",
            tags: ["Tax Planning", "Production Accounts"],
            impact: "18% reduction in annual tax liability"
        },
        {
            title: "Migolive Pvt Ltd",
            logo: "/images/clients/migolive.png",
            website: "https://www.zaubacorp.com/MIGOLIVE-TECHNOLOGY-OPC-PRIVATE-LIMITED-U72900HR2021OPC096562",
            category: "Media & Production",
            location: "Karnal & Chandigarh",
            description: "Managed inter-state GST (IGST) complexities and supply chain taxation. Implementation of structured inventory and tax reconciliation systems.",
            tags: ["GST IGST", "FMCG Compliance"],
            impact: "Zero penalty assessment across 5+ years"
        },
        {
            title: "THE CLEAN LAUNDRO SERVICE",
            logo: "/images/clients/laundro.png",
            category: "Service Industry",
            location: "Andhra Pradesh",
            description: "Remote financial management for scalable service operations. Handling all GST filings, TDS, and statutory financial reporting.",
            tags: ["Cloud Accounting", "Remote Compliance"],
            impact: "100% on-time filing for 8+ quarters"
        },
        {
            title: "RD Mega Mart",
            logo: "/images/clients/rdmegamart.png",
            category: "Retail & Shopping Mall",
            location: "Sitamarhi, Bihar",
            description: "Comprehensive taxation services for large-scale retail operations. Managing complex GST reconciliations for multi-location shopping complexes.",
            tags: ["Retail Tax", "Multi-location GST"],
            impact: "Streamlined multi-state GST compliance"
        }
    ]

    const expertSkills = [
        { name: "Direct Taxation", level: 95 },
        { name: "GST Compliance", level: 98 },
        { name: "Financial Audit", level: 90 },
        { name: "Corporate Advisory", level: 85 },
        { name: "Tally / ERP Systems", level: 95 },
    ]

    const typewriterWords = ["Drives Growth.", "Saves Tax.", "Ensures Compliance.", "Simplifies Finance."]

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-indigo-600/10 selection:text-indigo-700 dark:selection:bg-indigo-400/10 dark:selection:text-indigo-300">
            <Navbar />

            <main className="pt-20">
                {/* Modern Portfolio Hero */}
                <section className="relative min-h-[85vh] flex items-center overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/50 dark:bg-indigo-900/10 skew-x-12 translate-x-1/4 -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-full blur-3xl -z-10"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-6">
                                    <Zap size={16} className="animate-pulse" /> Available for Expert Consultation
                                </div>
                                <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.2] lg:leading-[1.1] min-h-[120px] md:min-h-[160px] lg:min-h-[180px]">
                                    Expertise That <br />
                                    <TypewriterText words={typewriterWords} />
                                </h1>
                                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 md:mb-10 max-w-xl leading-relaxed">
                                    I am <span className="font-extrabold text-gray-900 dark:text-white">Bablu Kumar</span>, a dedicated Tax Advisor transforming financial complexity into strategic clarity for businesses across India.
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    <motion.button
                                        onClick={scrollToPortfolio}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:shadow-inner transition-all"
                                    >
                                        View My Work <ArrowRight size={20} />
                                    </motion.button>
                                </div>

                                <div className="mt-12 flex items-center gap-8">
                                    <div className="flex -space-x-4">
                                        {[
                                            { src: "/images/clients/uniclips.png", name: "Uniclips" },
                                            { src: "/images/clients/migolive.png", name: "Migolive" },
                                            { src: "https://i.pravatar.cc/150?u=12", name: "Client 3" },
                                            { src: "https://i.pravatar.cc/150?u=13", name: "Client 4" }
                                        ].map((client, i) => (
                                            <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-950 bg-white overflow-hidden shadow-lg relative group">
                                                <img
                                                    src={client.src}
                                                    alt={client.name}
                                                    className="w-full h-full object-contain p-1"
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?name=${client.name}&background=random`
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex text-amber-500 gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                                        </div>
                                        <p className="text-sm font-bold text-gray-500">Trusted by 500+ Clients Pan-India</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="relative order-first lg:order-last mb-12 lg:mb-0"
                            >
                                <div className="relative z-10 w-full aspect-square max-w-md mx-auto">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 rounded-[3rem] blur-2xl"></div>
                                    <div className="relative h-full w-full rounded-[3rem] overflow-hidden border-8 border-white dark:border-gray-900 shadow-2xl group bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src="/images/team/bablu-kumar.png"
                                            alt="Bablu Kumar"
                                            className="w-full h-full object-cover transition-all duration-500"
                                            onError={(e) => {
                                                e.target.src = 'https://ui-avatars.com/api/?name=Bablu+Kumar&background=4f46e5&color=fff&size=512'
                                            }}
                                        />
                                    </div>

                                    {/* Floating Stats Card */}
                                    <motion.div
                                        animate={{ y: [0, -15, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -bottom-6 -right-6 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 hidden md:block"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black">20%</p>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Tax Saved</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Dynamic Stats Section */}
                <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center p-6 md:p-8 bg-white dark:bg-gray-900 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800 group">
                                    <div className="inline-flex p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                                        <stat.icon size={24} md:size={32} />
                                    </div>
                                    <h3 className="text-2xl md:text-4xl font-black mb-1 md:mb-2">{stat.value}</h3>
                                    <p className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Project Portfolio Section */}
                <section ref={portfolioRef} className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div>
                            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                <span className="w-12 h-[2px] bg-indigo-600"></span> Know Your Expert
                            </h2>
                            <h3 className="text-4xl md:text-5xl font-black leading-tight">Key Enterprise <br /> Engagements</h3>
                        </div>
                        <p className="text-gray-500 font-medium max-w-md text-right md:text-left">
                            Comprehensive financial and taxation management for diverse corporate entities across multiple industries and states.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {portfolioItems.map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -8 }}
                                className="group relative bg-white dark:bg-gray-900 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-14 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col gap-8 md:gap-10"
                            >
                                {/* Background Accent */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                                    <div className="flex-shrink-0">
                                        <div className="w-32 h-32 md:w-44 md:h-44 bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-2 border-gray-50 dark:border-gray-700/50 shadow-2xl group-hover:border-indigo-500/30 transition-all duration-500 relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                            {item.website ? (
                                                <a href={item.website} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center relative z-20 group/logo">
                                                    {item.logo ? (
                                                        <img
                                                            src={item.logo}
                                                            alt={item.title}
                                                            className="w-full h-full object-fill relative z-10 transition-transform duration-500 group-hover/logo:scale-[1.02]"
                                                            onError={(e) => {
                                                                const initials = item.title.split(' ').map(n => n[0]).join('').substring(0, 2);
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = `<div class="text-6xl font-black text-indigo-600 dark:text-indigo-400 opacity-20">${initials}</div>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center justify-center">
                                                            <Briefcase className="text-indigo-600 dark:text-indigo-400" size={56} />
                                                        </div>
                                                    )}
                                                </a>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {item.logo ? (
                                                        <img
                                                            src={item.logo}
                                                            alt={item.title}
                                                            className="w-full h-full object-fill relative z-10 transition-transform duration-500 group-hover/logo:scale-[1.02]"
                                                            onError={(e) => {
                                                                const initials = item.title.split(' ').map(n => n[0]).join('').substring(0, 2);
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = `<div class="text-6xl font-black text-indigo-600 dark:text-indigo-400 opacity-20">${initials}</div>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center justify-center">
                                                            <Briefcase className="text-indigo-600 dark:text-indigo-400" size={56} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-grow space-y-4">
                                        <div className="flex flex-col items-start gap-3">
                                            <span className="text-[10px] font-black px-4 py-1.5 bg-indigo-600 text-white rounded-full uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                                {item.category}
                                            </span>
                                            <div className="flex flex-col gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Location</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase">📍 {item.location.split(',')[0]}</span>
                                                    {item.location.includes(',') && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                                            <span className="text-[10px] font-bold text-gray-500 italic uppercase"> {item.location.split(',')[1]}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-3xl md:text-4xl font-black leading-tight text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                            {item.website ? (
                                                <a href={item.website} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-indigo-500/30 underline-offset-8">
                                                    {item.title}
                                                </a>
                                            ) : item.title}
                                        </h4>
                                    </div>
                                </div>

                                <div className="space-y-8 flex-grow">
                                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                        {item.description}
                                    </p>

                                    <div className="p-6 md:p-8 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-950 rounded-[2rem] border border-emerald-100/50 dark:border-emerald-900/30 relative overflow-hidden group/impact">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover/impact:scale-150 transition-transform duration-500"></div>
                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 relative z-10">Measurable Impact</p>
                                        <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white relative z-10">{item.impact}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Expert Skills Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl -mr-64 -mt-64"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-3xl -ml-64 -mb-64"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                                    Specialized <br />
                                    <span className="text-indigo-600 dark:text-indigo-400">Tax Expertise</span>
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 font-medium leading-relaxed">
                                    With over a decade of deep involvement in the Indian tax landscape, I've developed specialized mastery over critical financial domains.
                                </p>

                                <div className="space-y-8">
                                    {expertSkills.map((skill, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between mb-3">
                                                <span className="font-black text-sm uppercase tracking-wider">{skill.name}</span>
                                                <span className="text-indigo-400 font-black">{skill.level}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${skill.level}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1.5, delay: i * 0.1 }}
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-emerald-600"
                                                ></motion.div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-6 pt-12">
                                    {[
                                        { title: "Strategic Planning", desc: "Long-term tax roadmap for sustainability." },
                                        { title: "Audit Defense", desc: "Expert representation during assessments." }
                                    ].map((item, i) => (
                                        <div key={i} className="p-8 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-indigo-500/50 transition-colors">
                                            <h4 className="font-black mb-2 text-indigo-400">{item.title}</h4>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { title: "Risk Mitigation", desc: "Identifying compliance gaps early." },
                                        { title: "Process Design", desc: "Lean accounting systems for scale." }
                                    ].map((item, i) => (
                                        <div key={i} className="p-8 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-indigo-500/50 transition-colors">
                                            <h4 className="font-black mb-2 text-indigo-400">{item.title}</h4>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Professional Journey Section */}
                <section className="py-24 bg-gray-50 dark:bg-gray-900/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-4xl md:text-5xl font-black text-center mb-16">Professional Journey</h2>
                        <div className="relative" ref={journeyRef}>
                            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-indigo-100 dark:bg-indigo-900/30 hidden md:block">
                                <motion.div
                                    style={{ height: carMove }}
                                    className="absolute top-0 left-0 w-full bg-indigo-600 origin-top"
                                />
                                <motion.div
                                    style={{ top: carMove }}
                                    className="absolute left-1/2 -translate-x-1/2 z-30 -mt-4 w-10 h-10 bg-white dark:bg-gray-900 rounded-full shadow-2xl flex items-center justify-center border-2 border-indigo-600"
                                >
                                    <span className="text-xl">🚗</span>
                                </motion.div>
                            </div>

                            <div className="space-y-16">
                                {[
                                    {
                                        year: "2023 - Present",
                                        title: "Lead Tax Advisor & Proprietor",
                                        place: "TaxFriend India, Karnal",
                                        desc: "Leading a specialized tax practice that empowers SMEs through strategic compliance and proactive financial planning."
                                    },
                                    {
                                        year: "2013 - 2022",
                                        title: "Corporate Tax Specialist",
                                        place: "Regional Advisory Firms",
                                        desc: "Developed expertise in GST implementation, multi-state tax reconciliation, and representing clients in complex audit assessments."
                                    },
                                    {
                                        year: "Academic Core",
                                        title: "Bachelor of Commerce (B.Com)",
                                        place: "Specialization in Finance & Taxation",
                                        desc: "Gained comprehensive theoretical knowledge and professional foundation in Indian tax statutes and corporate accounting."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className={`flex flex-col md:flex-row items-center gap-6 md:gap-8 ${i % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                                        <div className="w-full md:w-1/2 flex justify-center md:justify-end px-4">
                                            <motion.div
                                                initial={{ opacity: 0, y: 50 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                                className={`p-6 md:p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-500/5 w-full max-w-md ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}
                                            >
                                                <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs md:text-sm uppercase tracking-widest">{item.year}</span>
                                                <h4 className="text-lg md:text-xl font-black mt-2 mb-2 md:mb-3">{item.title}</h4>
                                                <p className="text-[10px] md:text-xs font-bold text-gray-400 mb-3 md:mb-4">{item.place}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                                            </motion.div>
                                        </div>

                                        <div className="relative z-10 w-12 h-12 bg-indigo-600 rounded-full border-4 border-white dark:border-gray-950 flex items-center justify-center text-white shadow-xl">
                                            <Briefcase size={24} />
                                        </div>

                                        <div className="w-full md:w-1/2 px-4 hidden md:block text-left">
                                            <motion.div
                                                initial={{ opacity: 0, y: -100, rotate: -10 }}
                                                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 100,
                                                    damping: 10,
                                                    delay: i * 0.3,
                                                    duration: 1.2
                                                }}
                                                className="text-indigo-600/20 dark:text-indigo-400/10 font-black text-9xl select-none"
                                            >
                                                0{i + 1}
                                            </motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Portfolio CTA */}
                <section className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white dark:bg-gray-900 rounded-[3rem] p-12 md:p-20 text-center border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600"></div>

                            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Ready to Elevate Your <br /> Financial Strategy?</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                                Whether you're a startup needing foundational compliance or a scaling firm looking to optimize your tax outgo, let's create your success story.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <motion.button
                                    onClick={() => navigate('/login')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20"
                                >
                                    Book a Free Consultation
                                </motion.button>
                                <a href="tel:+918409847102" className="px-12 py-5 bg-white dark:bg-gray-950 text-indigo-600 border-2 border-indigo-600 rounded-2xl font-black text-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-2">
                                    <Phone size={20} /> Call Direct
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div >
    )
}

// Export
export default PortfolioExpert;
