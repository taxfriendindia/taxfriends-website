import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Target, Users, Heart, MapPin, CheckCircle } from 'lucide-react'
import Navbar from '../../components/Shared/Navbar'
import Footer from '../../components/Shared/Footer'

const About = () => {
  // SEO & Schema Markup Implementation
  useEffect(() => {
    document.title = "About TaxFriends | Your Trusted Tax & Business Compliance Partner Since 2013"

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.content = "TaxFriends: Your Trusted Tax & Business Compliance Partner Since 2013. 500+ Happy Clients, 95% Success Rate, Serving 50+ Cities Across India."
    } else {
      const meta = document.createElement('meta')
      meta.name = "description"
      meta.content = "TaxFriends: Your Trusted Tax & Business Compliance Partner Since 2013. 500+ Happy Clients, 95% Success Rate, Serving 50+ Cities Across India."
      document.head.appendChild(meta)
    }

    // Inject Schema.org JSON-LD
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "TaxFriends",
      "description": "Professional Tax & Business Compliance Services Across India",
      "url": "https://taxfriends.com",
      "telephone": "+91-8409847102",
      "email": "taxfriend.gst@gmail.com",
      "foundingDate": "2013",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Mohanth Sah Chowk Naka Number 1, SK Color Lab Gali",
        "addressLocality": "Sitamarhi",
        "addressRegion": "Bihar",
        "postalCode": "843302",
        "addressCountry": "IN"
      },
      "areaServed": {
        "@type": "Country",
        "name": "India"
      },
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": "26.5937",
          "longitude": "85.4802"
        },
        "geoRadius": "2000000"
      }
    })
    document.head.appendChild(script)

    return () => {
      // Cleanup schema script on unmount
      document.head.removeChild(script)
    }
  }, [])

  const milestones = [
    { year: '2013', event: 'Founded in Bihar with local business understanding' },
    { year: '2015', event: 'Expanded services to include GST and company registration' },
    { year: '2018', event: 'Started serving clients across North India' },
    { year: '2020', event: 'Digital transformation with online service delivery' },
    { year: '2022', event: 'Pan-India presence with clients from 50+ cities' },
    { year: '2024', event: '500+ happy clients and growing' }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
            >
              About TaxFriends: Your Trusted Partner in <br />
              <span className="text-blue-600">Tax & Business Compliance Since 2013</span>
            </motion.h1>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">From Bihar to Bharat: A Journey of Trust & Excellence</h2>
            <p className="mb-6">
              Welcome to <strong>TaxFriends</strong>, your reliable partner for all tax and business compliance needs.
              Founded in 2013 with a vision to simplify tax compliance for Indian businesses, we've grown from a local service
              provider in Bihar to a pan-India trusted brand serving clients across 50+ cities. With over <strong>500+ happy clients</strong> and a
              <strong>95% success rate</strong>, we combine traditional expertise with modern technology to deliver exceptional results.
            </p>
            <p>
              Our journey began in Sitamarhi, Bihar, with deep understanding of local business challenges. Today, we proudly serve
              businesses from Delhi to Bengaluru, Mumbai to Kolkata, bringing the same commitment to excellence to every client,
              regardless of location. Our <strong>10+ years of experience</strong> in tax filing, GST services, company registration,
              and business compliance makes us your ideal partner for all regulatory requirements.
            </p>
          </div>
        </section>

        {/* Our Story & Milestones */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story: Building Trust One Client at a Time</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                  TaxFriends was founded with a simple yet powerful mission: <em>"To make tax compliance simple and accessible for every Indian business."</em>
                  What started as a small tax consultancy service in Bihar has evolved into a comprehensive business compliance solutions provider serving clients nationwide.
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Our growth story is built on three pillars: <strong>Expertise, Trust, and Accessibility</strong>. We understand that tax compliance
                  can be overwhelming for business owners. Our goal is to handle all your compliance needs so you can focus on what you do best – growing your business.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Our Journey & Milestones</h3>
                <div className="space-y-4">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="font-bold text-blue-600 w-16 flex-shrink-0">{m.year}</div>
                      <div className="text-gray-600 dark:text-gray-400">{m.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Our Mission & Vision</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h3>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "To make tax compliance simple and accessible for every Indian business, empowering entrepreneurs to focus on growth while we handle their compliance needs with expertise and integrity."
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-8 rounded-2xl border border-purple-100 dark:border-purple-800 text-center">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h3>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "To be India's most trusted tax and compliance partner, known for reliability, expertise, and client-centric approach across all business segments, from startups to established enterprises."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Why Businesses Across India Choose TaxFriends</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: '10+ Years Expertise', desc: 'Deep knowledge and experience since 2013 in tax and business services across various industries.' },
                { title: 'Expert CA Support', desc: 'Direct access to professional Chartered Accountants and tax experts for personalized guidance.' },
                { title: 'Digital First Approach', desc: 'Online services with offline trust. Complete digital workflow management for convenience.' },
                { title: '100% Secure', desc: 'Bank-level document security and complete confidentiality assurance for all client data.' },
                { title: 'Pan-India Coverage', desc: 'Serving clients across 50+ cities in India with local understanding and national capabilities.' },
                { title: 'Transparent Pricing', desc: 'No hidden charges. Clear pricing with value-added services for complete peace of mind.' }
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: '💎', title: 'Integrity', desc: 'Honest and transparent services with complete confidentiality.' },
                { icon: '🚀', title: 'Innovation', desc: 'Technology-driven solutions for modern business needs.' },
                { icon: '🤝', title: 'Trust', desc: 'Client relationships built on trust, reliability, and long-term commitment.' },
                { icon: '🌍', title: 'Accessibility', desc: 'Services designed for businesses of all sizes, from startups to enterprises.' }
              ].map((val, i) => (
                <div key={i} className="p-6">
                  <div className="text-4xl mb-4">{val.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{val.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Presence */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Presence Across India</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-white/20 p-3 rounded-lg"><MapPin className="w-6 h-6" /></div>
                    <div>
                      <h4 className="font-bold text-lg">Head Office</h4>
                      <p className="opacity-90">
                        Mohanth Sah Chowk Naka Number 1<br />
                        SK Color Lab Gali, Sitamarhi<br />
                        Bihar - 843302, India
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Service Areas</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm opacity-90">
                      <p><strong>North:</strong> Delhi, UP, Bihar, Punjab, Haryana</p>
                      <p><strong>South:</strong> Karnataka, TN, Kerala, Telangana</p>
                      <p><strong>West:</strong> Maharashtra, Gujarat, Rajasthan</p>
                      <p><strong>East:</strong> West Bengal, Odisha, Jharkhand</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="inline-grid grid-cols-2 gap-6">
                  <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-sm opacity-80">Happy Clients</div>
                  </div>
                  <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                    <div className="text-3xl font-bold">95%</div>
                    <div className="text-sm opacity-80">Success Rate</div>
                  </div>
                  <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                    <div className="text-3xl font-bold">50+</div>
                    <div className="text-sm opacity-80">Cities Served</div>
                  </div>
                  <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                    <div className="text-3xl font-bold">10+</div>
                    <div className="text-sm opacity-80">Years Experience</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default About
