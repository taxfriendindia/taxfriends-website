import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle, Users, Target, Shield, Zap, MapPin, Menu, X, Phone, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const Home = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl filter" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl filter" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-full px-4 py-1.5 mb-8">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Available across India</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight leading-tight"
            >
              Your Tax Worries{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                End Here
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Professional tax filing, GST registration, and business compliance services.
              <span className="font-semibold text-gray-800 dark:text-gray-200"> Trusted by 500+ businesses.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center"
              >
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#services"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full font-bold text-lg shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center"
              >
                View Services
              </a>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="bg-blue-50 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                  <stat.icon size={24} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.number}</h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Comprehensive Tax & Business Solutions
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Everything you need to run your business compliantly and efficiently, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group"
              >
                <div className="text-4xl mb-6 bg-gray-50 dark:bg-gray-700 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  {service.description}
                </p>
                <div className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2.5"></div>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-xl font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-blue-500/30"
                  >
                    Get Started <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Businesses Trust TaxFriends
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6 transform hover:rotate-6 transition-transform duration-300">
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
