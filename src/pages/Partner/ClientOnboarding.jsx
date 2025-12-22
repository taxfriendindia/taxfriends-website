import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, Users, Search, ChevronRight, FileText, CheckCircle2,
    ArrowLeft, Upload, Send, MessageCircle, AlertCircle, Building2,
    User, Zap, Shield, MapPin, Smartphone, Mail, Sparkles,
    Briefcase, ArrowRight, Loader2, Globe
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ClientOnboarding = () => {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Select Type, 2: Select/Create Client, 3: Select Service, 4: Success
    const [type, setType] = useState(null); // 'new' | 'existing'
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [catalog, setCatalog] = useState([]);

    // Selection State
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedService, setSelectedService] = useState(null);

    const [newClientForm, setNewClientForm] = useState({
        full_name: '', mothers_name: '', aadhar_number: '', pan_number: '',
        gst_number: '', organization: '', state: '', city: '',
        mobile_number: '', email: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch catalog
            const { data: cat } = await supabase.from('service_catalog').select('*').order('title');
            setCatalog(cat || []);

            // Fetch this partner's clients
            const { data: myClients } = await supabase
                .from('profiles')
                .select('*')
                .eq('partner_id', user.id)
                .order('full_name');
            setClients(myClients || []);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const handleNewClientSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Check if user already exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id, full_name, email, mobile_number')
                .or(`mobile_number.eq.${newClientForm.mobile_number},email.eq.${newClientForm.email}`)
                .maybeSingle();

            if (existingProfile) {
                alert(`Error: A user with this contact information is already registered. Please use 'Existing Client' or check details.`);
                setLoading(false);
                return;
            }

            // 2. Create Shadow Profile
            const shadowId = crypto.randomUUID();
            const { data, error } = await supabase
                .from('profiles')
                .insert([{
                    id: shadowId,
                    ...newClientForm,
                    partner_id: user.id,
                    role: 'client'
                }])
                .select()
                .single();

            if (error) throw error;

            // 3. Send Invitation Email
            await supabase.auth.signInWithOtp({
                email: newClientForm.email,
                options: {
                    data: {
                        full_name: newClientForm.full_name,
                        partner_id: user.id
                    }
                }
            });

            setSelectedClient(data);
            setStep(3);
        } catch (error) {
            alert(`Error: ${error.message || 'Failed to create client.'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceRequest = async () => {
        if (!selectedClient || !selectedService) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('user_services')
                .insert([{
                    user_id: selectedClient.id,
                    service_id: selectedService.id,
                    partner_id: user.id,
                    is_assisted_service: true,
                    status: 'pending'
                }]);

            if (error) throw error;
            setStep(4);
        } catch (error) {
            alert('Error creating service request.');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile_number?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {/* Multi-step Header */}
            <div className="mb-16">
                <div className="flex items-center justify-between max-w-2xl mx-auto relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2" />
                    {[1, 2, 3, 4].map((num) => (
                        <div key={num} className="flex flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 shadow-xl ${step >= num ? 'bg-slate-900 text-white translate-y-[-4px]' : 'bg-white text-slate-300 border border-slate-100'
                                }`}>
                                {step > num ? <CheckCircle2 size={20} className="text-emerald-400" /> : num}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${step >= num ? 'text-slate-900' : 'text-slate-300'}`}>
                                {['Source', 'Identity', 'Service', 'Ready'][num - 1]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Type Selection */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <SelectionCard
                            icon={UserPlus}
                            title="New Subscriber"
                            desc="Registration for first-time clients. We will send an invitation to claim their dashboard."
                            accent="blue"
                            onClick={() => { setType('new'); setStep(2); }}
                        />
                        <SelectionCard
                            icon={Users}
                            title="Returning Client"
                            desc="Service request for clients already in your franchise network database."
                            accent="emerald"
                            onClick={() => { setType('existing'); setStep(2); }}
                        />
                    </motion.div>
                )}

                {/* Step 2: Form or Search */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-8 md:p-12">
                            <div className="flex items-center gap-4 mb-10">
                                <button onClick={() => setStep(1)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-100"><ArrowLeft size={20} /></button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                        {type === 'new' ? 'Client Registration' : 'Client Identity'}
                                    </h2>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Step 02: Verification of details</p>
                                </div>
                            </div>

                            {type === 'new' ? (
                                <form onSubmit={handleNewClientSubmit} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <OnboardInput label="Full Name" value={newClientForm.full_name} onChange={v => setNewClientForm({ ...newClientForm, full_name: v })} icon={User} required />
                                        <OnboardInput label="Mother's Name" value={newClientForm.mothers_name} onChange={v => setNewClientForm({ ...newClientForm, mothers_name: v })} icon={User} required />
                                        <OnboardInput label="Mobile Number" value={newClientForm.mobile_number} onChange={v => setNewClientForm({ ...newClientForm, mobile_number: v })} icon={Smartphone} required />
                                        <OnboardInput label="Email Address" value={newClientForm.email} onChange={v => setNewClientForm({ ...newClientForm, email: v })} icon={Mail} required type="email" />
                                        <OnboardInput label="Aadhar ID" value={newClientForm.aadhar_number} onChange={v => setNewClientForm({ ...newClientForm, aadhar_number: v })} icon={FileText} />
                                        <OnboardInput label="PAN Card" value={newClientForm.pan_number} onChange={v => setNewClientForm({ ...newClientForm, pan_number: v })} icon={FileText} />
                                        <div className="md:col-span-2"><OnboardInput label="Organization / Entity Name" value={newClientForm.organization} onChange={v => setNewClientForm({ ...newClientForm, organization: v })} icon={Briefcase} /></div>
                                        <OnboardInput label="GSTIN" value={newClientForm.gst_number} onChange={v => setNewClientForm({ ...newClientForm, gst_number: v })} icon={Building2} />
                                        <div className="flex gap-4">
                                            <OnboardInput label="City" value={newClientForm.city} onChange={v => setNewClientForm({ ...newClientForm, city: v })} icon={MapPin} />
                                            <OnboardInput label="State" value={newClientForm.state} onChange={v => setNewClientForm({ ...newClientForm, state: v })} icon={Globe} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} className="text-amber-400" /> Verified & Continue <ArrowRight size={20} /></>}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-8">
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Quick search by name, contact or ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-8 font-bold text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredClients.length === 0 ? (
                                            <div className="py-20 text-center text-slate-300 font-bold italic text-sm">No records found in your network</div>
                                        ) : (
                                            filteredClients.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => { setSelectedClient(c); setStep(3); }}
                                                    className="w-full flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/5 transition-all group"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                                                            {c.full_name?.charAt(0)}
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="font-black text-slate-900 tracking-tight">{c.full_name}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.mobile_number} • {c.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-white rounded-xl border border-slate-100 text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Service Selection */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xl text-indigo-400">
                                    {selectedClient?.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Processing for</p>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedClient?.full_name}</h3>
                                </div>
                            </div>
                            <button onClick={() => setStep(2)} className="h-10 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">Change</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {catalog.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className={`p-8 rounded-[40px] text-left transition-all relative overflow-hidden group border-2 ${selectedService?.id === service.id
                                            ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-600/10'
                                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                                        }`}
                                >
                                    {selectedService?.id === service.id && (
                                        <div className="absolute top-6 right-6 text-indigo-600"><CheckCircle2 size={28} /></div>
                                    )}
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <FileText className="text-slate-400" size={24} />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-lg tracking-tight mb-2">{service.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6 line-clamp-2 md:min-h-[30px]">{service.description}</p>
                                    <div className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full inline-block">
                                        {service.price_range || 'Official Processing'}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedService && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleServiceRequest}
                                disabled={loading}
                                className="w-full h-20 bg-indigo-600 text-white rounded-[2rem] font-black text-base uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={24} className="animate-spin" /> : <><Zap size={24} className="text-amber-400" /> Initialize Processing</>}
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-12 md:p-20 rounded-[4rem] border border-slate-200 shadow-2xl text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-indigo-600" />
                        <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                            <CheckCircle2 size={56} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Request Deployed!</h2>
                        <p className="text-slate-400 font-bold text-sm max-w-md mx-auto mb-16 leading-relaxed">
                            Professional processing for <strong>{selectedClient?.full_name}</strong> has been initiated. Collect documents to finalize.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
                            <SuccessAction
                                icon={Upload}
                                title="Upload Records"
                                desc="Direct dashboard entry"
                                onClick={() => window.location.href = '/partner/clients'}
                            />
                            <SuccessAction
                                icon={MessageCircle}
                                title="WhatsApp Support"
                                desc="Expert consultation"
                                color="emerald"
                                onClick={() => window.open(`https://wa.me/917814234033?text=Documents%20for%20${selectedClient?.full_name}%20for%20${selectedService?.title}`, '_blank')}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => { setStep(1); setType(null); setSelectedClient(null); setSelectedService(null); }}
                                className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                            >
                                Start New Onboarding
                            </button>
                            <button
                                onClick={() => window.location.href = '/partner/dashboard'}
                                className="h-14 px-10 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Franchise Home
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SelectionCard = ({ icon: Icon, title, desc, accent, onClick }) => {
    const accents = {
        blue: 'hover:border-blue-600/30 hover:shadow-blue-600/10 group-hover:bg-blue-600',
        emerald: 'hover:border-emerald-600/30 hover:shadow-emerald-600/10 group-hover:bg-emerald-600'
    };

    return (
        <button
            onClick={onClick}
            className={`bg-white p-10 md:p-12 rounded-[48px] border-2 border-slate-100 shadow-sm transition-all text-left flex flex-col group h-full relative overflow-hidden ${accents[accent]}`}
        >
            <div className={`w-20 h-20 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mb-10 transition-all duration-500 shadow-sm group-hover:text-white ${accents[accent].split(' ')[2]}`}>
                <Icon size={40} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight group-hover:translate-x-1 transition-transform">{title}</h3>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10 flex-1">{desc}</p>
            <div className={`flex items-center font-black text-[10px] uppercase tracking-[0.2em] gap-3 ${accent === 'blue' ? 'text-blue-600' : 'text-emerald-600'} group-hover:translate-x-2 transition-transform`}>
                Initialize Entry <ArrowRight size={18} />
            </div>
        </button>
    );
};

const OnboardInput = ({ label, icon: Icon, type = "text", value, onChange, required }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label} {required && '*'}</label>
        <div className="relative group/input">
            <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-slate-800 transition-colors" size={20} />
            <input
                type={type}
                required={required}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}...`}
                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-700 placeholder:text-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
            />
        </div>
    </div>
);

const SuccessAction = ({ icon: Icon, title, desc, color = "indigo", onClick }) => (
    <button onClick={onClick} className={`p-8 rounded-[32px] border transition-all text-center flex flex-col items-center group ${color === 'emerald' ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
        }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${color === 'emerald' ? 'bg-white text-emerald-600 shadow-emerald-200' : 'bg-white text-indigo-600 shadow-indigo-200'
            } shadow-lg`}>
            <Icon size={24} />
        </div>
        <h4 className={`font-black text-sm tracking-tight ${color === 'emerald' ? 'text-emerald-900' : 'text-indigo-900'}`}>{title}</h4>
        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${color === 'emerald' ? 'text-emerald-500' : 'text-indigo-500'}`}>{desc}</p>
    </button>
);

export default ClientOnboarding;
