import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, Users, Search, ChevronRight, FileText, CheckCircle2,
    ArrowLeft, Upload, Send, MessageCircle, AlertCircle, Building2,
    User, Zap, Shield, MapPin, Smartphone, Mail, Sparkles,
    Briefcase, ArrowRight, Loader2, Globe, FileUp, X, Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { useSearchParams } from 'react-router-dom';

const ClientOnboarding = () => {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Select Service, 2: Client & Docs, 3: Success
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedService, setSelectedService] = useState(null);
    const [clientData, setClientData] = useState({
        full_name: '',
        mobile_number: '',
        email: '',
        state: 'All',
        city: 'All'
    });
    const [files, setFiles] = useState([]);
    const [fileStatus, setFileStatus] = useState('');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        fetchCatalog();
        const clientId = searchParams.get('clientId');
        if (clientId) fetchClientDetails(clientId);
    }, [searchParams]);

    const fetchClientDetails = async (id) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setClientData({
                    full_name: data.full_name || '',
                    mobile_number: data.mobile_number || '',
                    email: data.email || '',
                    state: data.residential_state || 'All',
                    city: data.residential_city || 'All'
                });
            }
        } catch (error) {
            console.error('Error fetching client details:', error);
        }
    };

    const fetchCatalog = async () => {
        try {
            const { data } = await supabase.from('service_catalog').select('*').order('title');
            setCatalog(data || []);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!selectedService || !clientData.full_name || !clientData.mobile_number) {
            alert('Please fill in required fields (Name & Mobile).');
            return;
        }

        setLoading(true);
        setFileStatus('Verifying Client Identity...');

        try {
            // 1. Check or Create Profile (Shadow)
            let clientId;
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('mobile_number', clientData.mobile_number)
                .maybeSingle();

            if (existingProfile) {
                clientId = existingProfile.id;
                // Update profile with latest name/details if provided
                await supabase.from('profiles').update({
                    full_name: clientData.full_name,
                    residential_state: clientData.state === 'All' ? null : clientData.state,
                    residential_city: clientData.city === 'All' ? null : clientData.city,
                    partner_id: user.id // Tie to this partner if not already
                }).eq('id', clientId);
            } else {
                const shadowId = crypto.randomUUID();
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: shadowId,
                        full_name: clientData.full_name,
                        mobile_number: clientData.mobile_number,
                        email: clientData.email || null,
                        residential_state: clientData.state === 'All' ? null : clientData.state,
                        residential_city: clientData.city === 'All' ? null : clientData.city,
                        partner_id: user.id,
                        role: 'client'
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                clientId = newProfile.id;
            }

            // 2. Create Service Request
            setFileStatus('Creating Service Ticket...');
            const { data: serviceReq, error: serviceError } = await supabase
                .from('user_services')
                .insert([{
                    user_id: clientId,
                    service_id: selectedService.id,
                    partner_id: user.id,
                    status: 'pending'
                }])
                .select()
                .single();

            if (serviceError) throw serviceError;

            // 3. Upload Documents (Optional - skip if storage not configured)
            if (files.length > 0) {
                setFileStatus(`Uploading ${files.length} Document(s)...`);
                try {
                    for (const file of files) {
                        await UserService.uploadDocument(clientId, file, file.name, 'general');
                    }
                } catch (uploadError) {
                    console.warn('Document upload failed (storage not configured):', uploadError);
                    // Continue anyway - documents can be uploaded later
                }
            }

            setStep(3);
        } catch (error) {
            console.error('Submission Error:', error);
            alert(`Submission Failed: ${error.message}`);
        } finally {
            setLoading(false);
            setFileStatus('');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6">
            {/* Simple Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-16">
                {[1, 2, 3].map(num => (
                    <div key={num} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${step >= num ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-300 border border-slate-100'
                            }`}>
                            {step > num ? <CheckCircle2 size={18} /> : num}
                        </div>
                        {num < 3 && <div className={`w-8 h-0.5 rounded-full ${step > num ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Select Service */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-10"
                    >
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Select Processing Service</h1>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">What does your client need today?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {catalog.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => { setSelectedService(service); setStep(2); }}
                                    className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all text-left flex flex-col group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-700">
                                        <ServiceIcon name={service.icon} size={120} />
                                    </div>
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                                        <ServiceIcon name={service.icon} size={28} />
                                    </div>
                                    <h3 className="font-black text-slate-900 text-xl tracking-tight mb-2">{service.title}</h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider line-clamp-2 mb-6">{service.description}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">Official Process</span>
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Client & Documents */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                            <div className="bg-slate-900 p-8 text-white relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <button onClick={() => setStep(1)} className="p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Selected Service</p>
                                        <h3 className="text-2xl font-black tracking-tight">{selectedService?.title}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest">
                                        Official Processing
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleFinalSubmit} className="p-10 md:p-14 space-y-12">
                                {/* Client Info Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20} /></div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Client Information</h4>
                                        <div className="h-px bg-slate-100 flex-1" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <input
                                                required
                                                value={clientData.full_name}
                                                onChange={e => setClientData({ ...clientData, full_name: e.target.value })}
                                                placeholder="Enter Client Full Name"
                                                className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                            <input
                                                required
                                                type="tel"
                                                value={clientData.mobile_number}
                                                onChange={e => setClientData({ ...clientData, mobile_number: e.target.value })}
                                                placeholder="Phone without +91"
                                                className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-bold text-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Document Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={20} /></div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Required Documents</h4>
                                        <div className="h-px bg-slate-100 flex-1" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <label className="group relative cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-12 transition-all hover:bg-indigo-50/50">
                                            <input type="file" multiple onChange={handleFileChange} className="hidden" />
                                            <div className="flex flex-col items-center gap-4 text-center">
                                                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
                                                    <FileUp size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Upload Files</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">PDF, JPEG or PNG (Max 5MB each)</p>
                                                </div>
                                            </div>
                                        </label>

                                        {files.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                                {files.map((file, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0">
                                                                <FileText size={14} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-700 truncate">{file.name}</span>
                                                        </div>
                                                        <button type="button" onClick={() => removeFile(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full h-20 bg-indigo-600 text-white rounded-[2.5rem] font-black text-base uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-xl shadow-indigo-500/20 hover:bg-slate-950 transition-all disabled:opacity-50 mt-10"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            <span className="text-xs">{fileStatus}</span>
                                        </>
                                    ) : (
                                        <>Deploy Service Request <ArrowRight size={24} /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-12 md:p-24 rounded-[5rem] border border-slate-200 shadow-2xl text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-indigo-600" />
                        <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                            <CheckCircle2 size={64} />
                        </div>
                        <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter uppercase">Deployed!</h2>
                        <p className="text-slate-400 font-bold text-sm max-w-md mx-auto mb-16 leading-relaxed uppercase tracking-widest">
                            The service request has been transmitted and the documents are being processed by our admin team.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => { setStep(1); setFiles([]); setClientData({ full_name: '', mobile_number: '', email: '', state: 'All', city: 'All' }); }}
                                className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                            >
                                New Request
                            </button>
                            <button
                                onClick={() => window.location.href = '/partner/dashboard'}
                                className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ServiceIcon = ({ name, size = 24 }) => {
    const icons = {
        'activity': Activity,
        'shield': Shield,
        'users': Users,
        'zap': Zap,
        'globe': Globe,
        'briefcase': Briefcase,
        'building': Building2,
        'file-text': FileText,
    };
    const IconComponent = icons[name?.toLowerCase()] || Sparkles;
    return <IconComponent size={size} />;
};

export default ClientOnboarding;
