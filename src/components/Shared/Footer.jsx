import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Mail, ChevronRight, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

const Footer = () => {
    const navigate = useNavigate()
    // Exact location of your office for Google Maps Direction
    const officeAddress = "Mohanth Sah Chowk Naka Number 1, SK Color Lab Gali, Sitamarhi, Bihar 843302"
    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(officeAddress)}`

    // Handle scroll to services
    const handleServiceClick = (e, serviceName) => {
        e.preventDefault()
        // Determine target ID based on service (you might need to update Home.jsx to have these IDs)
        // For now, general scroll to services section
        navigate('/')
        setTimeout(() => {
            const section = document.getElementById('services')
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' })
            }
        }, 100)
    }

    return (
        <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div>
                        <Link to="/" className="flex items-center space-x-2 mb-6 group">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                                TF
                            </div>
                            <span className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">TaxFriend</span>
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-sm">
                            Your trusted partner for all tax and business compliance needs. Simplifying finance for businesses across India since 2013.
                        </p>
                        <div className="flex space-x-4">
                            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
                                <a key={idx} href="#" className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-blue-600 rounded-full"></span>
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { name: 'Home', path: '/' },
                                { name: 'About Us', path: '/about' },
                                { name: 'Contact', path: '/contact' },
                                { name: 'Login', path: '/login' },
                                { name: 'Privacy Policy', path: '/privacy-policy' }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link to={link.path} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 flex items-center group">
                                        <ChevronRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
                                        <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
                            Services
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-blue-600 rounded-full"></span>
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { name: 'Income Tax Filing', path: '/#services' },
                                { name: 'GST Registration', path: '/#services' },
                                { name: 'Company Formation', path: '/#services' },
                                { name: 'MSME Registration', path: '/#services' },
                                { name: 'TDS Filing', path: '/#services' }
                            ].map((service) => (
                                <li key={service.name}>
                                    <a
                                        href={service.path}
                                        onClick={(e) => handleServiceClick(e, service.name)}
                                        className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 flex items-center group"
                                    >
                                        <ChevronRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200" />
                                        <span className="group-hover:translate-x-1 transition-transform">{service.name}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
                            Contact Us
                            <span className="absolute -bottom-2 left-0 w-12 h-1 bg-blue-600 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex items-start group">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3 mt-1 group-hover:scale-110 transition-transform">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400 text-sm block mb-1">
                                        Mohanth Sah Chowk Naka Number 1<br />
                                        SK Color Lab Gali, Sitamarhi<br />
                                        Bihar 843302
                                    </span>
                                    <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center mt-1"
                                    >
                                        Get Directions <ChevronRight size={12} className="ml-0.5" />
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-center group">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 mr-3 group-hover:scale-110 transition-transform">
                                    <Phone size={18} />
                                </div>
                                <a href="tel:8409847102" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors font-medium">
                                    +91 8409847102
                                </a>
                            </li>
                            <li className="flex items-center group">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 mr-3 group-hover:scale-110 transition-transform">
                                    <Mail size={18} />
                                </div>
                                <a href="mailto:taxfriend.gst@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors font-medium text-sm">
                                    taxfriend.gst@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <p>© {new Date().getFullYear()} TaxFriend. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
