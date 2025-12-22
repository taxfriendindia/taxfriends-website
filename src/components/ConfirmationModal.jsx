import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-3xl relative z-10 border border-slate-100 overflow-hidden"
                    >
                        <div className="text-center">
                            <div className={`w-20 h-20 ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
                                <AlertTriangle size={40} />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                                {title}
                            </h3>

                            <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 px-4 uppercase tracking-wide">
                                {message}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 py-4 ${danger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
