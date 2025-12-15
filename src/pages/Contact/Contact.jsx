import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, ChevronDown, Zap, Target, Lock, Wallet, ArrowRight } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const Contact = () => {
  // SEO setup
  useEffect(() => {
    document.title = "Contact TaxFriends - Your Trusted Tax Partner"
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.content = "Get experienced tax and compliance support. Contact TaxFriends for GST, ITR, and business registration. Serving clients across India."
  }, [])

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', service: '', message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setFormData({ name: '', email: '', phone: '', service: '', message: '' })
      // Reset success message
      setTimeout(() => setIsSuccess(false), 5000)
    }, 1500)
  }

  // FAQs Data
  const faqs = [
    { q: "How quickly can you start my GST registration?", a: "Usually within 24 hours of document submission. We prioritize getting your business compliant as fast as possible." },
    { q: "Do you handle clients outside Bihar?", a: "Yes! We serve clients across 50+ cities in India through our seamless digital workflows and online portal." },
    { q: "What documents do I need for ITR filing?", a: "Basic documents like PAN, Aadhaar, Form 16/16A, and bank statements are typically required. Our team will guide you based on your specific case." },
    { q: "Can you help with urgent tax notices?", a: "Absolutely. We have a dedicated team for handling tax notices and providing emergency compliance support." }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 scroll-smooth">
      <Navbar />
      <main className="pt-20">

        {/* 1. Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                Let's Start Your <span className="text-blue-200">Compliance Journey</span> Together
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto font-light">
                Expert Tax Solutions Just a Message Away
              </p>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
                className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
              >
                At TaxFriends, we believe in personalized service and timely support. Whether you need GST registration, ITR filing, or business compliance guidance, our team of experienced CAs is ready to assist you.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* 2. Contact Cards (3-Column) */}
        <section className="py-16 -mt-10 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Phone Card */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-t-4 border-blue-500 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-blue-100/50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-blue-600 animate-pulse">
                  <Phone size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Call Our Experts</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-6 font-medium">
                  <p className="text-3xl font-bold text-blue-600">8409847102</p>
                  <p>Mon-Sat, 9 AM - 7 PM</p>
                  <p className="text-sm text-red-500 font-semibold flex items-center gap-1"><Zap size={14} /> Emergency Support Available</p>
                </div>
                <a href="tel:8409847102" className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30">
                  📱 Tap to Call
                </a>
              </motion.div>

              {/* Email Card */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-t-4 border-purple-500 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-purple-100/50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6 text-purple-600">
                  <Mail size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Us</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                  <p className="font-semibold">Start: <span className="font-normal">taxfriend.gst@gmail.com</span></p>
                  <p className="font-semibold">Support: <span className="font-normal">taxfriend.tax@gmail.com</span></p>
                  <p className="text-sm text-green-600 font-medium">Responds within 4 hours</p>
                </div>
                <a href="mailto:taxfriend.gst@gmail.com" className="block w-full text-center py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-500/30">
                  ✉️ Send Email
                </a>
              </motion.div>

              {/* Address Card */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-t-4 border-green-500 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-green-100/50 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600">
                  <MapPin size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Visit Our Office</h3>
                <div className="space-y-4 text-gray-600 dark:text-gray-300 mb-6 leading-tight">
                  <p>Mohanth Sah Chowk Naka Number 1<br />SK Color Lab Gali, Sitamarhi<br />Bihar - 843302</p>
                  <p className="text-sm italic text-gray-500">Near Sitamarhi Railway Station</p>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Mohanth+Sah+Chowk+Naka+Number+1,+Sitamarhi,+Bihar"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-green-500/30"
                >
                  🗺️ Get Directions
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 3. Interactive Map Visualization */}
        <section className="py-16 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide">Pan-India Presence</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-4">Now Serving 50+ Cities Across India</h2>
            </div>

            <div className="relative bg-blue-50 dark:bg-gray-900 border border-blue-100 dark:border-gray-700 rounded-3xl p-4 md:p-12 overflow-hidden h-[500px] flex items-center justify-center">
              {/* Abstract Map Nodes Animation */}
              <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/India_loction_map.svg/866px-India_loction_map.svg.png')] bg-contain bg-no-repeat bg-center transform scale-110"></div>

              {/* Animated Pulse for Bihar */}
              <div className="absolute top-[38%] right-[32%] z-10 hidden md:block">
                <div className="relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white"></span>
                  <span className="absolute left-6 top-0 w-max bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">Bihar HQ</span>
                </div>
              </div>

              {/* radiating lines or city markers would be complex css/svg, simplified here with text nodes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 relative z-10 w-full max-w-5xl">
                {['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad'].map((city, i) => (
                  <motion.div
                    key={city}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-800 dark:text-gray-200 font-bold"
                  >
                    <MapPin size={16} className="text-blue-500 mr-2" /> {city}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Contact Form Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-8 md:p-12">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Send Us Your Query</h2>
                  <p className="text-gray-500 dark:text-gray-400">Fill out the form below and our team will get back to you shortly.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSuccess && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-center mb-6">
                      <CheckCircle className="w-5 h-5 mr-2" /> Message Sent Successfully!
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                      <input
                        type="text" name="name" required value={formData.name} onChange={handleChange}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="Enter your full name"
                      />
                    </motion.div>
                    <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                      <input
                        type="email" name="email" required value={formData.email} onChange={handleChange}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="you@example.com"
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                      <input
                        type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="+91 00000 00000"
                      />
                    </motion.div>
                    <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Interested In</label>
                      <div className="relative">
                        <select
                          name="service" value={formData.service} onChange={handleChange}
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer dark:text-white"
                        >
                          <option value="">Select a Service...</option>
                          <option>Income Tax Filing (ITR)</option>
                          <option>GST Services</option>
                          <option>Company Registration</option>
                          <option>MSME Registration</option>
                          <option>TDS Filing</option>
                          <option>Other</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      </div>
                    </motion.div>
                  </div>

                  <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Message *</label>
                    <textarea
                      name="message" required value={formData.message} onChange={handleChange} rows="5"
                      className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none dark:text-white"
                      placeholder="Describe your requirements... Mention any deadlines."
                    ></textarea>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 text-lg"
                  >
                    {isSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>📨 Send Message</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Value Proposition */}
        <section className="py-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Zap, title: "Fast Response", desc: "Responses within 4 hours", color: "text-amber-500 bg-amber-50" },
                { icon: Target, title: "Expert Guidance", desc: "Experienced CAs", color: "text-blue-500 bg-blue-50" },
                { icon: Lock, title: "Confidentiality", desc: "100% Secure Data", color: "text-green-500 bg-green-50" },
                { icon: Wallet, title: "Free Consultation", desc: "No initial obligations", color: "text-purple-500 bg-purple-50" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-center"
                >
                  <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${item.color.replace('text-', 'bg-opacity-20 ')}`}>
                    <item.icon className={item.color.split(' ')[0]} size={28} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. FAQ Accordion */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* 7. Emergency Banner */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="flex items-center space-x-3 mb-2 md:mb-0">
              <span className="animate-pulse bg-white text-red-600 font-bold px-2 py-0.5 rounded text-xs uppercase tracking-wider">Urgent</span>
              <span className="font-bold text-lg">🚨 Need Immediate Help with GST Deadlines?</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="tel:8409847102" className="flex items-center font-bold hover:underline">
                <Phone size={18} className="mr-2" /> Call Now: 8409847102
              </a>
            </div>
          </div>
        </div>

        {/* 8. Call To Action */}
        <section className="py-16 bg-blue-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Your Tax Worries End Here</h2>
            <div className="flex flex-wrap justify-center gap-6 text-lg font-medium opacity-90">
              <span className="flex items-center"><Phone size={20} className="mr-2" /> Call</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center"><Mail size={20} className="mr-2" /> Email</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center"><Send size={20} className="mr-2" /> Message</span>
            </div>
            <p className="mt-4 opacity-75">We're Here to Help!</p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {question}
        <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="p-5 pt-0 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/50">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Contact
