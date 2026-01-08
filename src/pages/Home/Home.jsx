import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { ArrowRight, CheckCircle, Users, Target, Shield, Zap, MapPin, Menu, X, Phone, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'
import TestimonialCarousel from '../../components/Home/TestimonialCarousel'

const Home = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(150)

  const words = ["Made Effortless", "Simplified", "Stress-Free", "Handled Expertly", "Made Easy"]

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % words.length
      const fullText = words[i]

      setText(isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1))

      setTypingSpeed(isDeleting ? 75 : 150)

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2500) // Pause at end for 2.5 seconds
      } else if (isDeleting && text === '') {
        setIsDeleting(false)
        setLoopNum(loopNum + 1)
        setTypingSpeed(500) // Pause before starting next word
      }
    }

    const timer = setTimeout(handleTyping, typingSpeed)
    return () => clearTimeout(timer)
  }, [text, isDeleting, loopNum, typingSpeed, words])

  const stats = [
    { icon: Users, number: '500+', label: 'Happy Clients' },
    { icon: CheckCircle, number: '95%', label: 'Success Rate' },
    { icon: MapPin, number: '50+', label: 'Cities Served' },
    { icon: Target, number: '10+', label: 'Years Experience' },
  ]

  const services = [
    {
      icon: '📝',
      title: 'Income Tax Filing',
      description: 'Complete ITR filing for individuals and businesses with maximum refund assurance.',
      features: ['Individual ITR', 'Business ITR', 'Tax Planning', 'Notice Handling']
    },
    {
      icon: '🏢',
      title: 'GST Services',
      description: 'End-to-end GST solutions including registration, filing, and compliance.',
      features: ['GST Registration', 'GSTR-3B Filing', 'GSTR-1', 'GST Returns']
    },
    {
      icon: '🏛️',
      title: 'Company Registration',
      description: 'Register your business as Private Limited, LLP, or Partnership firm.',
      features: ['Private Limited', 'LLP Registration', 'OPC', 'Partnership']
    },
    {
      icon: '📈',
      title: 'MSME Registration',
      description: 'Get your MSME/Udyam registration with all government benefits.',
      features: ['Udyam Certificate', 'Loan Benefits', 'Subsidies', 'Tax Rebates']
    },
    {
      icon: '💰',
      title: 'TDS Filing',
      description: 'Complete TDS compliance including return filing and certificate issuance.',
      features: ['TDS Returns', 'Form 16/16A', 'Compliance', 'Assessment']
    },
    {
      icon: '🍽️',
      title: 'FSSAI Registration',
      description: 'Food license registration for restaurants and food businesses.',
      features: ['Basic Registration', 'State License', 'Central License', 'Renewal']
    }
  ]

  const features = [
    {
      icon: Target,
      title: '10+ Years Expertise',
      description: 'Deep knowledge and experience since 2013 in tax and business services.'
    },
    {
      icon: Zap,
      title: 'Digital First Approach',
      description: 'Online services with offline trust. Complete digital workflow management.'
    },
    {
      icon: Shield,
      title: '100% Secure',
      description: 'Bank-level document security and complete confidentiality assurance.'
    },
    {
      icon: Users,
      title: 'Expert CA Support',
      description: 'Direct access to professional Chartered Accountants and tax experts.'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 scroll-smooth">
      <Navbar />

      {/* Red Scrolling Banner */}
      <div className="bg-indigo-900 text-white overflow-hidden py-3 relative z-40 top-[80px] shadow-2xl">
        <div className="flex items-center">
          <div className="bg-emerald-600 px-6 py-1.5 z-10 font-black text-xs uppercase tracking-widest shadow-lg flex items-center whitespace-nowrap ml-2 rounded-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-ping mr-2"></span>
            Updates
          </div>
          <div className="whitespace-nowrap overflow-hidden flex-1">
            <div className="animate-marquee inline-block">
              {/* Set 1 */}
              <span className="mx-8 font-bold text-sm tracking-wide">Register your Company with TaxFriend India! 🚀</span>
              <span className="mx-8 font-bold text-sm tracking-wide text-emerald-300">GST Registration in 24 Hours! ⚡</span>
              <span className="mx-8 font-bold text-sm tracking-wide">Professional ITR Filing starting now! 🛡️</span>
              <span className="mx-8 font-bold text-sm tracking-wide text-amber-300">Need Immediate Compliance Help? Call Us! 📞</span>
              <span className="mx-8 font-bold text-sm tracking-wide">Save on Annual Maintenance Plans! 💰</span>
              <span className="mx-8 font-bold text-sm tracking-wide">1-on-1 Expert CA Consultation! 👨‍💼</span>
              <span className="mx-8 font-bold text-sm tracking-wide text-emerald-300">Paperless Digital Process! 📱</span>

              {/* Set 2 */}
              <span className="mx-8 font-bold text-sm tracking-wide">Register your Company with TaxFriend India! 🚀</span>
              <span className="mx-8 font-bold text-sm tracking-wide text-emerald-300">GST Registration in 24 Hours! ⚡</span>
              <span className="mx-8 font-bold text-sm tracking-wide">Professional ITR Filing starting now! 🛡️</span>
              <span className="mx-8 font-bold text-sm tracking-wide text-amber-300">Need Immediate Compliance Help? Call Us! 📞</span>
            </div>
          </div>
          <a href="tel:8409847102" className="hidden sm:flex items-center bg-white text-indigo-900 px-4 py-1.5 rounded-xl text-xs font-black mr-4 hover:bg-emerald-50 transition-all z-10 whitespace-nowrap shadow-xl">
            Support: 8409847102
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-56 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent" />
          <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] filter animate-pulse" />
          <div className="absolute bottom-20 left-[5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] filter" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center max-w-6xl mx-auto"
          >
            <div className="inline-flex items-center space-x-2 bg-indigo-50/80 dark:bg-indigo-900/40 backdrop-blur-md border border-indigo-100/50 dark:border-indigo-800 rounded-full px-5 py-2 mb-10 shadow-sm">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">India's Premium Compliance Partner</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-10 tracking-tighter leading-[0.9]"
            >
              Tax Compliance <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 inline-block">
                {text}
                <span className="inline-block w-1 h-16 md:h-24 bg-emerald-500 ml-2 animate-pulse align-middle"></span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Join <span className="text-indigo-700 font-black">500+ Indian Businesses</span> who trust <span className="text-emerald-600 font-black">TaxFriend India</span> for expert ITR filing, GST services, and seamless compliance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Link
                to="/login"
                className="w-full sm:w-auto px-10 py-5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center uppercase tracking-wider"
              >
                Start Your Journey <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
              <a
                href="#services"
                className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-indigo-900 dark:text-white border-2 border-indigo-50 dark:border-gray-700 rounded-2xl font-black text-lg shadow-xl hover:shadow-indigo-100 transition-all duration-300 flex items-center justify-center uppercase tracking-wider"
              >
                Explore Services
              </a>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-32">
            {stats.map((stat, index) => (
              <StatCounter key={index} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-indigo-50/30 dark:bg-indigo-950/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
              Premium Solutions for <span className="text-indigo-700">Modern Businesses</span>
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
              We handle the complexities of Indian regulations so you can focus on building your grand vision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 shadow-xl shadow-indigo-100/50 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 border border-indigo-50/50 dark:border-gray-700 group hover:-translate-y-3"
              >
                <div className="text-5xl mb-8 bg-indigo-50/50 dark:bg-indigo-900/30 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-500 border border-indigo-100/30">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 group-hover:text-indigo-700 transition-colors">
                  {service.title}
                </h3>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                  {service.description}
                </p>
                <div className="space-y-4">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-md font-bold text-gray-600 dark:text-gray-300">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-3 shadow-sm shadow-emerald-200"></div>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-indigo-50/50 dark:border-gray-700">
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full py-4 bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 shadow-xl shadow-indigo-500/20"
                  >
                    Select Service <ArrowRight size={18} className="ml-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Why Leaders Trust <span className="text-emerald-600">TaxFriend India</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 mx-auto mb-8 transform group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-500 shadow-lg shadow-indigo-100/50">
                  <feature.icon size={36} className="group-hover:rotate-12 transition-transform" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium px-4">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialCarousel />

      <Footer />
    </div>
  )
}

const StatCounter = ({ stat, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-50px" }) // Re-run everytime
  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)

  useEffect(() => {
    if (isInView) {
      // Parse number (remove non-digits for counting)
      const numericValue = parseInt(stat.number) || 0
      const animation = animate(count, numericValue, { duration: 1.5, ease: "easeOut" })
      return animation.stop
    } else {
      count.set(0)
    }
  }, [isInView, stat.number, count])

  // Extract suffix (e.g. "+" or "%")
  const suffix = stat.number.replace(/[0-9]/g, '')

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="p-10 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50/50 dark:border-gray-700 text-center hover:-translate-y-2 transition-all duration-500"
    >
      <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-700 dark:text-indigo-300 shadow-inner">
        <stat.icon size={32} />
      </div>
      <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 flex justify-center items-center tracking-tighter">
        <motion.span>{rounded}</motion.span>
        <span className="text-emerald-500">{suffix}</span>
      </h3>
      <p className="text-sm font-black uppercase tracking-widest text-indigo-900/40 dark:text-indigo-200/40">{stat.label}</p>
    </motion.div>
  )
}

export default Home
