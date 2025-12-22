import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, X, FileText, User, Briefcase, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

const ClientOnboarding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fileStatus, setFileStatus] = useState('');

    // Form Data - SIMPLIFIED: Services are created under PARTNER's ID
    const [clientData, setClientData] = useState({
        full_name: '',
        mobile_number: '',
        email: '',
        organization: '',
        state: '',
        city: ''
    });

    const [selectedService, setSelectedService] = useState(null);
    const [services, setServices] = useState([]);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        const { data } = await supabase
            .from('service_catalog')
            .select('*')
            .order('title');
        setServices(data || []);
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedService) {
            alert('Please select a service');
            return;
        }

        try {
            setLoading(true);
            console.log('=== CREATING SERVICE FOR PARTNER ===');
            console.log('Partner ID:', user.id);
            console.log('Service:', selectedService.title);
            console.log('Client Info:', clientData);

            // STEP 1: Create Service Request DIRECTLY under partner's ID
            // NO new user creation - everything under partner
            setFileStatus('Creating Service Request...');

            const serviceData = {
                user_id: user.id,  // PARTNER's ID, not a new client
                service_id: selectedService.id,
                partner_id: user.id,  // Also set partner_id for tracking
                status: 'pending',
                comments: `Client: ${clientData.full_name || 'N/A'}, Phone: ${clientData.mobile_number || 'N/A'}, Email: ${clientData.email || 'N/A'}, Org: ${clientData.organization || 'N/A'}`
            };

            console.log('Service data:', serviceData);

            const { data: serviceReq, error: serviceError } = await supabase
                .from('user_services')
                .insert([serviceData])
                .select()
                .single();

            if (serviceError) {
                console.error('Service creation error:', serviceError);
                throw serviceError;
            }

            console.log('Service created successfully:', serviceReq);

            // STEP 2: Upload Documents under PARTNER's ID
            if (files.length > 0) {
                setFileStatus(`Uploading ${files.length} Document(s)...`);
                try {
                    for (const file of files) {
                        // Upload under PARTNER's ID, with partner as uploader
                        await UserService.uploadDocument(
                            user.id,  // PARTNER's ID
                            file,
                            `${clientData.full_name || 'Client'} - ${file.name}`,
                            'general',
                            user.id  // uploaded_by = partner
                        );
                    }
                    console.log('Documents uploaded successfully under partner ID');
                } catch (uploadError) {
                    console.warn('Document upload failed:', uploadError);
                    // Continue anyway - documents can be uploaded later
                }
            }

            // STEP 3: Create notification for admin
            try {
                await UserService.createNotification(
                    user.id,
                    'Service Request Created',
                    `New ${selectedService.title} request for client: ${clientData.full_name}`,
                    'info'
                );
            } catch (notifError) {
                console.warn('Notification creation failed:', notifError);
            }

            setStep(3);
            console.log('=== SERVICE CREATION COMPLETE ===');

        } catch (error) {
            console.error('Submission Error:', error);
            alert(`Submission Failed: ${error.message}`);
        } finally {
            setLoading(false);
            setFileStatus('');
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-6 max-w-md"
                >
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">Service Request Created!</h2>
                    <p className="text-slate-600 font-bold">
                        Your service request for <span className="text-indigo-600">{clientData.full_name || 'client'}</span> has been submitted successfully.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setStep(1);
                                setClientData({ full_name: '', mobile_number: '', email: '', organization: '', state: '', city: '' });
                                setSelectedService(null);
                                setFiles([]);
                            }}
                            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Create Another
                        </button>
                        <button
                            onClick={() => navigate('/partner/services')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            View Services
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20 px-4">
            {/* Header */}
            <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Service Request</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                    Request a service for your client
                </p>
            </header>

            {/* Progress Steps */}
            <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                    { num: 1, label: 'Client Info' },
                    { num: 2, label: 'Service & Documents' }
                ].map((s, idx) => (
                    <React.Fragment key={s.num}>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all ${step >= s.num
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                {s.num}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-wider ${step >= s.num ? 'text-slate-900' : 'text-slate-400'
                                }`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < 1 && (
                            <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step > s.num ? 'bg-indigo-600' : 'bg-slate-200'
                                }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Client Information */}
            {step === 1 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-6"
                >
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Client Information</h2>
                        <p className="text-slate-500 text-sm font-bold">
                            Enter your client's details (for reference only)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                <User size={14} className="inline mr-1" /> Full Name
                            </label>
                            <input
                                type="text"
                                value={clientData.full_name}
                                onChange={(e) => setClientData({ ...clientData, full_name: e.target.value })}
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="Enter client name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Phone size={14} className="inline mr-1" /> Mobile Number
                            </label>
                            <input
                                type="tel"
                                value={clientData.mobile_number}
                                onChange={(e) => setClientData({ ...clientData, mobile_number: e.target.value })}
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="Enter mobile number"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Mail size={14} className="inline mr-1" /> Email (Optional)
                            </label>
                            <input
                                type="email"
                                value={clientData.email}
                                onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="Enter email"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Briefcase size={14} className="inline mr-1" /> Organization (Optional)
                            </label>
                            <input
                                type="text"
                                value={clientData.organization}
                                onChange={(e) => setClientData({ ...clientData, organization: e.target.value })}
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="Enter organization"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setStep(2)}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            Continue <ArrowRight size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 2: Service Selection & Documents */}
            {step === 2 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* Service Selection */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">Select Service</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map(service => (
                                <div
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedService?.id === service.id
                                            ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-500/10'
                                            : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">{service.icon || '📄'}</div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-900 mb-1">{service.title}</h3>
                                            <p className="text-xs text-slate-500 font-medium">{service.description}</p>
                                            {service.price_range && (
                                                <p className="text-xs font-black text-indigo-600 mt-2">{service.price_range}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
                            <FileText size={24} className="text-amber-600" />
                            Required Documents
                        </h2>
                        <p className="text-slate-500 text-sm font-bold mb-6">
                            Upload documents for this service request
                        </p>

                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-indigo-400 transition-all">
                            <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                            <p className="font-black text-slate-700 mb-2">Upload Files</p>
                            <p className="text-xs text-slate-400 font-bold mb-4">PDF, JPEG, OR PNG (MAX 5MB EACH)</p>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-all"
                            >
                                Choose Files
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="mt-6 space-y-2">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} className="text-indigo-600" />
                                            <span className="text-sm font-bold text-slate-700">{file.name}</span>
                                        </div>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="p-2 hover:bg-rose-100 rounded-lg transition-all"
                                        >
                                            <X size={18} className="text-rose-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            disabled={loading}
                            className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedService}
                            className="flex-1 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {fileStatus || 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Deploy Service Request
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ClientOnboarding;
