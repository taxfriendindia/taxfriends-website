import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const StatusModal = ({ isOpen, onClose, type = 'info', title, message, confirmLabel = 'Got it' }) => {
    const icons = {
        success: <CheckCircle2 size={48} className="text-emerald-500" />,
        error: <XCircle size={48} className="text-rose-500" />,
        warning: <AlertCircle size={48} className="text-amber-500" />,
        info: <Info size={48} className="text-indigo-500" />
    };

    const colors = {
        success: 'bg-emerald-50 border-emerald-100',
        error: 'bg-rose-50 border-rose-100',
        warning: 'bg-amber-50 border-amber-100',
        info: 'bg-indigo-50 border-indigo-100'
    };

    const btnColors = {
        success: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
        error: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
        warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
        info: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-[40px] w-full max-w-sm p-10 shadow-2xl relative z-10 border border-slate-100 text-center overflow-hidden"
                    >
                        {/* Decorative background circle */}
                        <div className={`absolute top-0 right-0 w-32 h-32 ${colors[type]} rounded-full blur-3xl -mr-16 -mt-16 opacity-50`} />

                        <div className="relative">
                            <div className="mb-6 flex justify-center">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                >
                                    {icons[type]}
                                </motion.div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3 italic">
                                {title}
                            </h3>

                            <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8 px-2 uppercase tracking-wide">
                                {message}
                            </p>

                            <button
                                onClick={onClose}
                                className={`w-full py-4 ${btnColors[type]} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default StatusModal;
