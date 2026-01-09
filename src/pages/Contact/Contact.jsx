import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, ChevronDown, Zap, Target, Lock, Wallet, ArrowRight } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'
import { supabase } from '../../lib/supabase'

const Contact = () => {
  // SEO setup
  useEffect(() => {
    document.title = "Contact TaxFriend India - Your Trusted Tax Partner"
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.content = "Get experienced tax and compliance support. Contact TaxFriend India for GST, ITR, and business registration. Serving clients across India."
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Save to Database
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            service: formData.service,
            message: formData.message
          }
        ])

      if (error) throw error

      // 2. Open WhatsApp with formatted message
      const adminPhone = '918409847102' // Format: Country Code + Number
      const whatsappMsg = `*New Inquiry from TaxFriend India Website*\n\n` +
        `*Name:* ${formData.name}\n` +
        `*Service:* ${formData.service || 'General Enquiry'}\n` +
        `*Phone:* ${formData.phone}\n` +
        `*Email:* ${formData.email}\n` +
        `*Message:* ${formData.message}`

      const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(whatsappMsg)}`

      // Open in a new tab
      window.open(waUrl, '_blank')

      // 3. Success state
      setIsSubmitting(false)
      setIsSuccess(true)
      setFormData({ name: '', email: '', phone: '', service: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)

    } catch (error) {
      console.error('Submission error:', error)
      alert("Something went wrong. Please try again or contact us directly.")
      setIsSubmitting(false)
    }
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
                At TaxFriend India, we believe in personalized service and timely support. Whether you need GST registration, ITR filing, or business compliance guidance, our team of experienced CAs is ready to assist you.
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-4 flex items-center justify-center gap-2">
                Now Serving <ContactStatCounter number="10+" /> Cities Across India
              </h2>
            </div>

            {/* Spider Layout Container */}
            <div className="relative w-full max-w-6xl mx-auto min-h-[600px] bg-blue-50/30 dark:bg-gray-800/30 rounded-3xl border border-blue-100 dark:border-gray-700 overflow-hidden flex flex-col items-center py-10">

              {/* Background Map (Faded) */}
              <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/India_loction_map.svg/866px-India_loction_map.svg.png')] bg-contain bg-no-repeat bg-center"></div>

              {/* SVG Connections (Desktop Only) */}
              <div className="absolute inset-0 z-10 pointer-events-none hidden md:block">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 600">
                  <defs>
                    <linearGradient id="spiderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" /> {/* Red gradient start from HQ */}
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  {/* Paths from Top Center (HQ) to approximate card locations */}
                  {/* HQ Node Center approx: x=600, y=100 (top-central) */}

                  {/* Row 1 cards: y=300. x positions: 200, 450, 750, 1000 */}
                  <path d="M 600 120 C 600 200, 200 200, 200 300" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" />
                  <path d="M 600 120 C 600 200, 450 200, 450 300" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <path d="M 600 120 C 600 200, 750 200, 750 300" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <path d="M 600 120 C 600 200, 1000 200, 1000 300" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" style={{ animationDelay: '0.6s' }} />

                  {/* Row 2 cards: y=450. x positions: 200, 450, 750, 1000 */}
                  <path d="M 600 120 C 580 200, 150 350, 200 450" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
                  <path d="M 600 120 C 590 200, 400 350, 450 450" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" style={{ animationDelay: '1.0s' }} />
                  <path d="M 600 120 C 610 200, 800 350, 750 450" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
                  <path d="M 600 120 C 620 200, 1050 350, 1000 450" stroke="url(#spiderGradient)" strokeWidth="3" fill="none" strokeDasharray="6,4" className="animate-pulse" style={{ animationDelay: '1.4s' }} />
                </svg>
              </div>

              {/* Central HQ Node (Top) */}
              <div className="relative z-20 mb-20 md:mb-24 transform hover:scale-110 transition-transform duration-300">
                <div className="relative group cursor-pointer flex flex-col items-center">
                  <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 border-4 border-white z-10">
                    <span className="text-4xl">🏢</span>
                  </div>
                  <span className="animate-ping absolute top-0 w-24 h-24 rounded-full bg-red-500 opacity-40"></span>
                  <div className="mt-4 bg-white px-6 py-2 rounded-full shadow-lg border border-red-100 text-red-600 font-extrabold text-lg text-center whitespace-nowrap z-20">
                    📍 Bihar Head Quarter
                  </div>
                </div>
              </div>

              {/* Cities Grid */}
              <div className="relative z-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-y-24 md:gap-x-12 px-4 w-full max-w-6xl justify-items-center">
                {['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad'].map((city, i) => (
                  <motion.div
                    key={city}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    className="bg-white dark:bg-gray-800 p-4 w-full md:w-48 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center font-bold text-gray-800 dark:text-white z-20 hover:shadow-xl hover:border-blue-200 transition-all"
                  >
                    <MapPin size={20} className="text-blue-500 mr-2" /> {city}
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

const ContactStatCounter = ({ number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-10px" })
  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)

  useEffect(() => {
    if (isInView) {
      const numericValue = parseInt(number) || 0
      const animation = animate(count, numericValue, { duration: 1, ease: "easeOut" })
      return animation.stop
    } else {
      count.set(0)
    }
  }, [isInView, number, count])

  const suffix = number.replace(/[0-9]/g, '')

  return (
    <span ref={ref} className="inline-flex items-center text-blue-600">
      <motion.span>{rounded}</motion.span>
      <span>{suffix}</span>
    </span>
  )
}

export default Contact
