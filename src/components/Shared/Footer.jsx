import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Mail, ChevronRight, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

const Footer = () => {
    const navigate = useNavigate()
    // Exact location of your office for Google Maps Direction
    const officeAddress = "Mohanth Sah Chowk Naka Number 1, SK Color Lab Gali, Sitamarhi, Bihar 843302"
    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(officeAddress)}`



    return (
        <footer className="bg-gradient-to-b from-indigo-50/50 to-white dark:from-gray-900 dark:to-gray-950 border-t border-indigo-100/50 dark:border-gray-800 pt-20 pb-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
                    {/* Brand Column */}
                    <div>
                        <Link to="/" className="flex items-center space-x-3 mb-8 group">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                    TF
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                            </div>
                            <span className="font-black text-2xl text-gray-900 dark:text-white tracking-tight">TaxFriend India</span>
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                            India's premium tax and compliance partner. Empowering businesses with expert solutions since 2013.
                        </p>
                        <div className="flex space-x-3">
                            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
                                <a key={idx} href="#" className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 hover:bg-indigo-700 hover:text-white dark:hover:bg-indigo-600 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white mb-8 relative inline-block">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Home', path: '/' },
                                { name: 'Know Your Expert', path: '/portfolio' },
                                { name: 'About Us', path: '/about' },
                                { name: 'Contact', path: '/contact' },
                                { name: 'Login', path: '/login' },
                                { name: 'Privacy Policy', path: '/privacy-policy' }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link to={link.path} className="text-gray-600 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all duration-200 flex items-center group font-semibold">
                                        <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-emerald-500" />
                                        <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white mb-8 relative inline-block">
                            Services
                            <span className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Income Tax Filing', path: '/services#itr' },
                                { name: 'GST Registration', path: '/services#gst' },
                                { name: 'Company Formation', path: '/services#company' },
                                { name: 'Trademark Registration', path: '/services#trademark' },
                                { name: 'MSME Registration', path: '/services#msme' },
                                { name: 'Accounting & TDS', path: '/services#accounting' }
                            ].map((service) => (
                                <li key={service.name}>
                                    <Link
                                        to={service.path}
                                        className="text-gray-600 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all duration-200 flex items-center group font-semibold"
                                    >
                                        <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-emerald-500" />
                                        <span className="group-hover:translate-x-1 transition-transform">{service.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white mb-8 relative inline-block">
                            Contact Us
                            <span className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-5">
                            <li className="flex items-start group">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-700 dark:text-indigo-400 mr-3 mt-1 group-hover:scale-110 transition-transform shadow-sm">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400 text-sm block mb-2 font-medium leading-relaxed">
                                        Mohanth Sah Chowk Naka Number 1<br />
                                        SK Color Lab Gali, Sitamarhi<br />
                                        Bihar 843302
                                    </span>
                                    <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-black text-indigo-700 hover:text-indigo-800 hover:underline flex items-center mt-1 uppercase tracking-wider"
                                    >
                                        Get Directions <ChevronRight size={14} className="ml-1" />
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-center group">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-400 mr-3 group-hover:scale-110 transition-transform shadow-sm">
                                    <Phone size={20} />
                                </div>
                                <a href="tel:8409847102" className="text-gray-600 dark:text-gray-400 hover:text-indigo-700 transition-colors font-bold">
                                    +91 8409847102
                                </a>
                            </li>
                            <li className="flex items-center group">
                                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-700 dark:text-purple-400 mr-3 group-hover:scale-110 transition-transform shadow-sm">
                                    <Mail size={20} />
                                </div>
                                <a href="mailto:taxfriend.gst@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-indigo-700 transition-colors font-bold text-sm">
                                    taxfriend.gst@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-indigo-100/50 dark:border-gray-800 pt-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 gap-6">
                    {/* Left corner */}
                    <p className="font-bold text-center md:text-left order-2 md:order-1">
                        © {new Date().getFullYear()} <span className="text-indigo-700 dark:text-indigo-400">TaxFriend India</span>. All rights reserved.
                    </p>

                    {/* Center Promotion */}
                    <div className="order-1 md:order-2 flex justify-center">
                        <p className="text-xs font-semibold px-6 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full border border-indigo-100/50 dark:border-indigo-800/50 inline-block text-center">
                            Website made and managed by <span className="text-emerald-600 dark:text-emerald-400">Aashish</span>.
                            <a
                                href="https://wa.me/919625351970?text=I%20am%20just%20curious%20about%20this%20website%20and%20wanna%20know%20how%20can%20I%20make%20mine."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-indigo-600 hover:text-indigo-700 underline transition-colors decoration-dashed underline-offset-4"
                            >
                                Contact for more info
                            </a>
                        </p>
                    </div>

                    {/* Right corner */}
                    <div className="flex space-x-8 order-3 justify-center md:justify-end">
                        <Link to="/privacy-policy" className="hover:text-indigo-700 transition-colors font-semibold">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-indigo-700 transition-colors font-semibold">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
