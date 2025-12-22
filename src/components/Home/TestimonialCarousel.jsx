import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const STATIC_REVIEWS = [
    { id: 1, full_name: "Aman Gupta", organization: "Gupta Electronics", rating: 5, comment: "Excellent service for GST registration. Got my number in just 1 day as promised! 🚀" },
    { id: 2, full_name: "Priya Sharma", organization: "Fashion Hub", rating: 5, comment: "Very professional team. They handled my income tax filing smoothly and maximized my refund. 💸" },
    { id: 3, full_name: "Rahul Mehra", organization: "Mehra & Sons", rating: 4, comment: "Good support for MSME registration. The process was quite fast and efficient. 🏢" },
    { id: 4, full_name: "Anjali Verma", organization: "Vertex Solutions", rating: 5, comment: "TaxFriends makes compliance so easy. I don't have to worry about deadlines anymore. 🛡️" },
    { id: 5, full_name: "Sandeep Kumar", organization: "Kumar Traders", rating: 5, comment: "Highly recommended for business registration. Their expert guidance was invaluable. 🤝" },
    { id: 6, full_name: "Megha Jain", organization: "Jain Decor", rating: 5, comment: "Reliable and efficient. The digital process is very convenient for busy business owners. 📱" },
    { id: 7, full_name: "Vikram Singh", organization: "Singh Logistics", rating: 4, comment: "Great experience with their TDS filing service. Very detailed and accurate record keeping. 📊" },
    { id: 8, full_name: "Deepak Patel", organization: "Patel Exports", rating: 5, comment: "The expert support is top-notch. They explained everything clearly and solved my tax issues. 👨‍💼" },
    { id: 9, full_name: "Sneha Reddy", organization: "Reddy Organics", rating: 5, comment: "Quick FSSAI license process. Very happy with the support team and their responsiveness. 🥦" },
    { id: 10, full_name: "Arjun Das", organization: "Das Enterprises", rating: 5, comment: "Best tax partner for startups. They handle everything from A-Z with total transparency. ✨" },
    { id: 11, full_name: "Kavita Singh", organization: "Singh & Co.", rating: 4, comment: "Professional and timely. Very satisfied with their corporate registration service. 🏛️" },
    { id: 12, full_name: "Rohan Kapoor", organization: "Kapoor Textiles", rating: 5, comment: "GST returns are now a breeze. Thank you TaxFriends for the amazing automation! ⚡" },
    { id: 13, full_name: "Sonia Bansal", organization: "Bansal Boutique", rating: 5, comment: "Great value for money. Exceptional tax planning advice that saved us a lot of profit. 💰" },
    { id: 14, full_name: "Manish Agarwal", organization: "Agarwal Agencies", rating: 5, comment: "The digital portal is very user-friendly. Document tracking is a great and helpful feature. 💻" },
    { id: 15, full_name: "Ritu Malhotra", organization: "Malhotra Interiors", rating: 4, comment: "Excellent communication and prompt responses to my queries regarding audit reports. 📞" },
    { id: 16, full_name: "Sanjay Joshi", organization: "Joshi Tech", rating: 5, comment: "They saved me from heavy penalties. Their expert advice is worth every penny indeed. 🏆" },
    { id: 17, full_name: "Anita Desai", organization: "Desai Flowers", rating: 5, comment: "Seamless experience for ITR filing. Transparent, trustworthy and highly recommended. 🌟" },
    { id: 18, full_name: "Vivek Tiwari", organization: "Tiwari Builders", rating: 5, comment: "Their knowledge of commercial laws and taxation is impressive. Genuine tax experts. 🧠" },
    { id: 19, full_name: "Preeti Goyal", organization: "Goyal Sweets", rating: 5, comment: "Prompt and accurate. I always recommend TaxFriends to my friends and family. 👩‍👩‍👧" },
    { id: 20, full_name: "Sameer Khan", organization: "Khan Auto", rating: 4, comment: "A solid tax partner for any small business owner. Very helpful and knowledgeable staff. ✅" }
];

const TestimonialCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-scroll effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % STATIC_REVIEWS.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    // Display 3 reviews at once on desktop, handle wrap-around
    const getVisibleReviews = () => {
        const visible = [];
        for (let i = 0; i < 3; i++) {
            visible.push(STATIC_REVIEWS[(currentIndex + i) % STATIC_REVIEWS.length]);
        }
        return visible;
    };

    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10 text-slate-900"><Quote size={120} /></div>
                <div className="absolute bottom-10 right-10 text-slate-900 rotate-180"><Quote size={120} /></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h4 className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] mb-4">Wall of Trust</h4>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Voices of TaxFriends</h2>
                    <p className="text-slate-500 mt-4 font-medium">Trusted by 500+ businesses across India for tax & compliance.</p>
                </div>

                <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {getVisibleReviews().map((review, idx) => (
                                <motion.div
                                    key={`${review.id}-${currentIndex}-${idx}`}
                                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full"
                                >
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-slate-600 font-medium italic leading-relaxed mb-8 flex-grow">
                                        "{review.comment}"
                                    </p>

                                    <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                                            {review.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h5 className="font-black text-slate-900 text-sm tracking-tight">
                                                {review.full_name}
                                            </h5>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {review.organization}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-center mt-12 gap-4">
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev - 1 + STATIC_REVIEWS.length) % STATIC_REVIEWS.length)}
                            className="p-3 bg-white border border-slate-100 rounded-full shadow-lg text-slate-400 hover:text-blue-600 hover:scale-110 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev + 1) % STATIC_REVIEWS.length)}
                            className="p-3 bg-white border border-slate-100 rounded-full shadow-lg text-slate-400 hover:text-blue-600 hover:scale-110 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialCarousel;
