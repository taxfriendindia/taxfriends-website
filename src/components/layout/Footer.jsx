import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const services = [
    { name: 'Income Tax Filing', href: '/services#itr' },
    { name: 'GST Services', href: '/services#gst' },
    { name: 'Company Registration', href: '/services#company' },
    { name: 'MSME Registration', href: '/services#msme' },
    { name: 'TDS Filing', href: '/services#tds' },
    { name: 'FSSAI Registration', href: '/services#fssai' },
  ]

  const company = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Refund Policy', href: '/refund-policy' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TF</span>
              </div>
              <span className="text-xl font-bold text-white">
                Tax<span className="text-blue-400">Friends</span>
              </span>
            </Link>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              Your Tax Worries End Here. With 10+ Years of Trusted Service Across India. 
              Starting from Bihar, Serving the Nation. 🇮🇳
            </p>
            <div className="flex space-x-3">
              <div className="bg-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                ✅ 500+ Happy Clients
              </div>
              <div className="bg-green-600 px-3 py-1 rounded-full text-xs font-medium">
                📈 95% Success Rate
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    to={service.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Company</h3>
            <ul className="space-y-2">
              {company.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Connect</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>📞</span>
                <a href="tel:8409847102" className="hover:text-white transition-colors">
                  8409847102
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <span>📧</span>
                <a href="mailto:taxfriend.gst@gmail.com" className="hover:text-white transition-colors">
                  taxfriend.gst@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <span>📧</span>
                <a href="mailto:taxfriend.tax@gmail.com" className="hover:text-white transition-colors">
                  taxfriend.tax@gmail.com
                </a>
              </div>
              <div className="flex items-start space-x-2 mt-4">
                <span>🏠</span>
                <div>
                  <p className="leading-relaxed">
                    Mohanth Sah Chowk Naka Number 1<br />
                    SK Color Lab Gali, Sitamarhi<br />
                    Bihar - 843302
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} TaxFriends. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            Starting from Bihar, Serving the Nation 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
