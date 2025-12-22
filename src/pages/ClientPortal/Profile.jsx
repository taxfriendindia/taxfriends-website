import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Phone, MapPin, Building, Save, FileText,
    CheckCircle, Camera, Loader2, AlertCircle, Calendar, Heart,
    Rocket, Sparkles, X, Shield, Clock, Wallet, Download,
    ChevronRight, ExternalLink, Activity, Target
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const Profile = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [forceHideSetup, setForceHideSetup] = useState(false)
    const [completionPercentage, setCompletionPercentage] = useState(0)
    const [missingFields, setMissingFields] = useState([])
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        dob: '',
        mothers_name: '',
        residential_address: '',
        residential_city: '',
        residential_state: '',
        residential_pincode: '',
        business_address: '',
        business_city: '',
        business_state: '',
        business_pincode: '',
        gst_number: '',
        business_name: '',
        avatar_url: '',
        payout_upi: '',
        kyc_status: ''
    })

    // Role-specific configurations for premium look
    const roleConfig = {
        superuser: {
            title: 'Master Control',
            subtitle: 'Superuser Authority & Access',
            color: 'indigo',
            gradient: 'from-indigo-600 to-violet-700',
            icon: Shield,
            theme: 'dark'
        },
        admin: {
            title: 'Admin Headquarters',
            subtitle: 'Manage Platform & Resources',
            color: 'blue',
            gradient: 'from-blue-600 to-indigo-700',
            icon: Target,
            theme: 'dark'
        },
        partner: {
            title: 'Partner Suite',
            subtitle: 'Franchise Growth & Performance',
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-700',
            icon: Building,
            theme: 'light'
        },
        client: {
            title: 'Personal Portal',
            subtitle: 'My Identity & Service Records',
            color: 'blue',
            gradient: 'from-blue-500 to-indigo-600',
            icon: User,
            theme: 'light'
        }
    }[user?.role || 'client']

    useEffect(() => {
        if (user) {
            fetchProfile()
        }
    }, [user])

    useEffect(() => {
        calculateCompletion()
    }, [formData])

    const calculateCompletion = () => {
        let required = [
            { key: 'full_name', label: 'Full Name' },
            { key: 'phone_number', label: 'Mobile' },
            { key: 'avatar_url', label: 'Profile Picture' },
            { key: 'residential_address', label: 'Address' },
            { key: 'residential_city', label: 'City' },
            { key: 'residential_state', label: 'State' },
            { key: 'residential_pincode', label: 'Pincode' }
        ]

        if (user?.role === 'partner' || user?.role === 'client') {
            required.push(
                { key: 'dob', label: 'DOB' },
                { key: 'mothers_name', label: "Mother's Name" },
                { key: 'business_name', label: 'Business Name' }
            )
        }

        const missing = required.filter(f => !formData[f.key] || formData[f.key].toString().trim().length === 0).map(f => f.label)
        setMissingFields(missing)
        const filled = required.length - missing.length
        setCompletionPercentage(Math.round((filled / required.length) * 100))
    }

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    phone_number: data.mobile_number || '',
                    dob: data.dob || '',
                    mothers_name: data.mothers_name || '',
                    residential_address: data.residential_address || '',
                    residential_city: data.residential_city || data.city || '',
                    residential_state: data.residential_state || data.state || '',
                    residential_pincode: data.residential_pincode || data.pincode || '',
                    business_address: data.business_address || '',
                    business_city: data.business_city || '',
                    business_state: data.business_state || '',
                    business_pincode: data.business_pincode || '',
                    gst_number: data.gst_number || '',
                    business_name: data.organization || '',
                    avatar_url: data.avatar_url || '',
                    payout_upi: data.payout_upi || '',
                    kyc_status: data.kyc_status || 'not_started'
                })
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleAvatarUpload = async (event) => {
        try {
            setUploading(true)
            setError(null)
            if (!event.target.files || event.target.files.length === 0) return

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }))

            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                avatar_url: publicUrl,
                updated_at: new Date()
            })

            setMessage('Avatar updated successfully!')
            setTimeout(() => setMessage(null), 3000)
        } catch (error) {
            setError(error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDocUpload = async (file, type) => {
        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/${type}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage.from('user_documents').upload(filePath, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('user_documents').getPublicUrl(filePath)

            // Register in user_documents table
            const { error: dbError } = await supabase.from('user_documents').insert({
                user_id: user.id,
                file_url: publicUrl,
                name: `${type.toUpperCase()} Card`,
                doc_type: type,
                status: 'pending'
            })

            if (dbError) throw dbError

            // Update profile status if it was not started or rejected
            if (formData.kyc_status === 'not_started' || formData.kyc_status === 'rejected') {
                await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id)
                setFormData(prev => ({ ...prev, kyc_status: 'pending' }))
            }

            setMessage(`${type.toUpperCase()} uploaded successfully!`)
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setError(`Upload failed: ${err.message}`)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        if (!formData.full_name || formData.full_name.trim().length < 3) { setError("Please enter a valid full name"); return }
        if (!formData.phone_number || formData.phone_number.trim().length < 10) { setError("Please enter a valid mobile number"); return }

        setSaving(true)
        setMessage(null)
        setError(null)

        try {
            const updates = {
                id: user.id,
                email: user.email,
                full_name: formData.full_name.trim(),
                mobile_number: formData.phone_number,
                dob: formData.dob || null,
                mothers_name: formData.mothers_name,
                residential_address: formData.residential_address,
                residential_city: formData.residential_city,
                residential_state: formData.residential_state,
                residential_pincode: formData.residential_pincode,
                business_address: formData.business_address,
                business_city: formData.business_city,
                business_state: formData.business_state,
                business_pincode: formData.business_pincode,
                city: formData.residential_city || formData.business_city,
                state: formData.residential_state || formData.business_state,
                pincode: formData.residential_pincode || formData.business_pincode,
                gst_number: formData.gst_number,
                organization: formData.business_name,
                avatar_url: formData.avatar_url,
                payout_upi: formData.payout_upi,
                updated_at: new Date()
            }

            const { error: updateError } = await supabase.from('profiles').upsert(updates)
            if (updateError) throw updateError

            setMessage('Profile updated successfully!')
            setIsEditing(false)
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setError(`Update failed: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={20} />
                </div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Syncing Cloud Profile</p>
            </div>
        )
    }

    const needsSetup = (!formData.full_name || !formData.phone_number) && !forceHideSetup && user?.role !== 'admin' && user?.role !== 'superuser';

    if (needsSetup && !isEditing) {
        return (
            <div className="max-w-xl mx-auto py-20 px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] p-12 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
                    <button onClick={() => setForceHideSetup(true)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
                    <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-8 relative rotate-6">
                        <User size={40} className="text-blue-600 -rotate-6" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-2 -right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg"><Sparkles size={16} /></motion.div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Complete Account Setup</h1>
                    <p className="text-slate-500 mb-10 leading-relaxed font-medium">To access all features and ensure secure processing of your requests, please provide your legal name and contact number.</p>
                    <button onClick={() => setIsEditing(true)} className="w-full h-[64px] bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                        Start Now
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pb-20">
            {/* Premium Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl bg-${roleConfig.color}-50 flex items-center justify-center text-${roleConfig.color}-600 shadow-sm border border-${roleConfig.color}-100`}>
                        <roleConfig.icon size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{roleConfig.title}</h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{roleConfig.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {message && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-black flex items-center gap-2">
                                <CheckCircle size={16} /> {message}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-black flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="px-8 py-3.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm">
                            Edit Profile
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Sidebar */}
                <aside className="lg:col-span-4 flex flex-col gap-8">
                    {/* User ID Card */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${roleConfig.color}-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-500`} />

                        <div className="relative flex flex-col items-center">
                            <div className="relative group/avatar mb-6">
                                <div className="w-32 h-32 rounded-[2.5rem] ring-8 ring-slate-50 overflow-hidden bg-slate-100 shadow-inner">
                                    {uploading ? (
                                        <div className="w-full h-full flex items-center justify-center bg-white/80 backdrop-blur-sm">
                                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                        </div>
                                    ) : formData.avatar_url ? (
                                        <img src={formData.avatar_url} alt="Profile" key={formData.avatar_url} crossOrigin="anonymous" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={64} /></div>
                                    )}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3.5 bg-white text-slate-700 rounded-2xl shadow-xl border border-slate-100 hover:text-blue-600 transition-all hover:scale-110 active:scale-95">
                                    <Camera size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-1">{formData.full_name || 'Guest User'}</h2>
                            <p className="text-slate-400 font-bold text-xs">{user.email}</p>

                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-500`}>
                                    ID: TF-{user.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-${roleConfig.color}-100 bg-${roleConfig.color}-50 text-${roleConfig.color}-600`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>



                    {user.role !== 'admin' && user.role !== 'superuser' && (
                        <>
                            {/* Progress Card */}
                            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Activity size={100} /></div>

                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Profile Health</h3>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Strength of identity records</p>
                                    </div>
                                    <div className="text-4xl font-black text-blue-400">{completionPercentage}%</div>
                                </div>

                                <div className="w-full h-4 bg-white/5 rounded-2xl p-1 mb-8 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionPercentage}%` }}
                                        className={`h-full rounded-xl bg-gradient-to-r ${roleConfig.gradient} shadow-[0_0_20px_rgba(59,130,246,0.3)]`}
                                    />
                                </div>

                                {missingFields.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Pending Action Items</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {missingFields.slice(0, 4).map((f, i) => (
                                                <div key={i} className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                                    <span className="text-[11px] font-bold text-slate-300">{f}</span>
                                                    <ChevronRight size={14} className="text-slate-600" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* KYC/Vault */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Shield size={20} /></div>
                                        <h3 className="font-black text-slate-900 tracking-tight">Identity Vault</h3>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${formData.kyc_status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-500' :
                                        formData.kyc_status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                            'bg-slate-50 text-slate-400 border-slate-200'
                                        }`}>
                                        {formData.kyc_status?.replace('_', ' ') || 'NONE'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <DocButton
                                        label="Aadhar Identity"
                                        onUpload={(f) => handleDocUpload(f, 'aadhar')}
                                        disabled={uploading || formData.kyc_status === 'verified'}
                                        status={formData.kyc_status}
                                    />
                                    <DocButton
                                        label="PAN Verification"
                                        onUpload={(f) => handleDocUpload(f, 'pan')}
                                        disabled={uploading || formData.kyc_status === 'verified'}
                                        status={formData.kyc_status}
                                    />
                                </div>

                                <p className="mt-6 text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                    * Your documents are encrypted and only accessible by compliance officers for identity verification.
                                </p>
                            </div>
                        </>
                    )}
                </aside>

                {/* Right Form Area */}
                <main className="lg:col-span-8 flex flex-col gap-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Basic Bio */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText size={18} /></div>
                                    <h3 className="font-black text-slate-900 tracking-tight">Legal Identity</h3>
                                </div>
                                {!isEditing && <button type="button" onClick={() => setIsEditing(true)} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Edit Entry</button>}
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputGroup label="Official Full Name" name="full_name" icon={User} value={formData.full_name} onChange={handleChange} disabled={!isEditing} placeholder="John Doe" />
                                <InputGroup label="Contact Access (Mobile)" name="phone_number" icon={Phone} value={formData.phone_number} onChange={handleChange} disabled={!isEditing} placeholder="+91 XXXXX XXXXX" type="tel" />

                                {(user.role === 'partner' || user.role === 'client') && (
                                    <>
                                        <InputGroup label="Identity DOB" name="dob" icon={Calendar} value={formData.dob} onChange={handleChange} disabled={!isEditing} type="date" />
                                        <InputGroup label="Guardian/Mother's Name" name="mothers_name" icon={Heart} value={formData.mothers_name} onChange={handleChange} disabled={!isEditing} placeholder="Legal Name" />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Residential Node */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><MapPin size={18} /></div>
                                <h3 className="font-black text-slate-900 tracking-tight">Geo-Location Details</h3>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Physical Address</label>
                                    <textarea
                                        name="residential_address"
                                        value={formData.residential_address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="House / Locality / Landmark"
                                        className="w-full min-h-[100px] p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none disabled:opacity-50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <InputGroup label="City" name="residential_city" value={formData.residential_city} onChange={handleChange} disabled={!isEditing} simple placeholder="E.g. Delhi" />
                                    <InputGroup label="State" name="residential_state" value={formData.residential_state} onChange={handleChange} disabled={!isEditing} simple placeholder="E.g. Delhi" />
                                    <InputGroup label="PIN Code" name="residential_pincode" value={formData.residential_pincode} onChange={handleChange} disabled={!isEditing} simple placeholder="XXXXXX" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Professional/Business Entity */}
                        {(user.role === 'partner' || user.role === 'client') && (
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Building size={18} /></div>
                                    <h3 className="font-black text-slate-900 tracking-tight">Entity Information</h3>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <InputGroup label="Firm/Organization Title" name="business_name" icon={Building} value={formData.business_name} onChange={handleChange} disabled={!isEditing} placeholder="Private Ltd / Sole Prop." />
                                    <InputGroup label="Tax Identifier (GST)" name="gst_number" icon={FileText} value={formData.gst_number} onChange={handleChange} disabled={!isEditing} placeholder="22AAAAA0000A1Z5" />
                                </div>
                            </div>
                        )}

                        {/* Section 4: External Payout (Partner ONLY) */}
                        {user.role === 'partner' && (
                            <div className="bg-indigo-900 rounded-[32px] border border-indigo-800 shadow-2xl overflow-hidden p-8 text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={80} /></div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-white/10 text-white rounded-lg"><Wallet size={18} /></div>
                                    <h3 className="font-black text-white tracking-tight">Financial Settlement Node</h3>
                                </div>
                                <div className="max-w-md">
                                    <InputGroup
                                        label="Primary UPI ID"
                                        name="payout_upi"
                                        icon={Sparkles}
                                        value={formData.payout_upi}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="username@bank"
                                        dark
                                    />
                                    <p className="mt-4 text-[10px] text-indigo-300 font-medium font-bold uppercase tracking-widest"> Settlements are processed to this ID every Friday.</p>
                                </div>
                            </div>
                        )}

                        {/* Stick Action Bar */}
                        {isEditing && (
                            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="sticky bottom-8 z-30 flex justify-end gap-4 p-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] shadow-2xl">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard Changes</button>
                                <button type="submit" disabled={saving} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3 disabled:opacity-50">
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Update Records
                                </button>
                            </motion.div>
                        )}
                    </form>
                </main>
            </div>
        </div>
    )
}

const InputGroup = ({ label, icon: Icon, simple, dark, ...props }) => (
    <div className="space-y-2">
        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${dark ? 'text-indigo-300' : 'text-slate-400'}`}>{label}</label>
        <div className="relative">
            {Icon && <Icon className={`absolute left-5 top-1/2 -translate-y-1/2 ${dark ? 'text-indigo-400' : 'text-slate-300'}`} size={18} />}
            <input
                {...props}
                className={`w-full h-[60px] ${Icon ? 'pl-14' : 'px-5'} rounded-2xl text-sm font-bold outline-none transition-all shadow-sm ${dark
                    ? 'bg-white/10 border-white/10 text-white placeholder:text-white/20 focus:bg-white/20'
                    : 'bg-slate-50 border-slate-100 text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    } disabled:opacity-50`}
            />
        </div>
    </div>
)

const DocButton = ({ label, onUpload, disabled, status }) => (
    <div className="relative group">
        <input type="file" className="hidden" id={`upload-${label}`} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} disabled={disabled} />
        <label
            htmlFor={`upload-${label}`}
            className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${disabled
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 cursor-default'
                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-blue-500 hover:shadow-lg'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${disabled ? 'bg-white' : 'bg-white shadow-sm'}`}>
                    {disabled ? <CheckCircle size={14} className="text-emerald-500" /> : <Activity size={14} className="text-blue-500" />}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            </div>
            {!disabled && <Download size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />}
            {disabled && <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 px-2.5 py-1 rounded-full">Securely Stored</span>}
        </label>
    </div>
)

export default Profile
