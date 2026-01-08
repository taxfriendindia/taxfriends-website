import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Phone, MapPin, Building, Save, FileText,
    CheckCircle, Camera, Loader2, AlertCircle, Calendar, Heart,
    Shield, Wallet, Download, Activity, Globe
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
    const [uploadingType, setUploadingType] = useState(null)
    const [userDocs, setUserDocs] = useState({ aadhar: null, pan: null })
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        full_name: '',
        mobile_number: '',
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
        organization: '',
        avatar_url: '',
        kyc_status: 'not_started'
    })

    useEffect(() => {
        if (user) {
            fetchProfile()
            fetchDocs()
        }
    }, [user])

    const fetchDocs = async () => {
        try {
            const { data, error } = await supabase
                .from('user_documents')
                .select('*')
                .eq('user_id', user.id)
            if (error) throw error
            const docs = { aadhar: null, pan: null }
            data?.forEach(doc => {
                if (doc.doc_type === 'aadhar') docs.aadhar = doc
                if (doc.doc_type === 'pan') docs.pan = doc
            })
            setUserDocs(docs)
        } catch (err) {
            console.error('Error fetching docs:', err)
        }
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
                    mobile_number: data.mobile_number || '',
                    dob: data.dob || '',
                    mothers_name: data.mothers_name || '',
                    residential_address: data.residential_address || '',
                    residential_city: data.residential_city || '',
                    residential_state: data.residential_state || '',
                    residential_pincode: data.residential_pincode || '',
                    business_address: data.business_address || '',
                    business_city: data.business_city || '',
                    business_state: data.business_state || '',
                    business_pincode: data.business_pincode || '',
                    gst_number: data.gst_number || '',
                    organization: data.organization || '',
                    avatar_url: data.avatar_url || '',
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

            // Immediately update database and local state
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)

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
            setUploadingType(type)
            setError(null)
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/${type}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage.from('user-documents').upload(filePath, file)
            if (uploadError) {
                if (uploadError.message.includes('bucket not found')) {
                    throw new Error('Storage system not initialized. Please run the SQL setup script in Supabase first.')
                }
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage.from('user-documents').getPublicUrl(filePath)

            // Register/Update in user_documents table
            const { data: existingDoc } = await supabase
                .from('user_documents')
                .select('id')
                .eq('user_id', user.id)
                .eq('doc_type', type)
                .maybeSingle()

            let dbError;
            if (existingDoc) {
                const { error } = await supabase.from('user_documents').update({
                    file_url: publicUrl,
                    name: `${type.toUpperCase()} Card`,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }).eq('id', existingDoc.id)
                dbError = error
            } else {
                const { error } = await supabase.from('user_documents').insert({
                    user_id: user.id,
                    file_url: publicUrl,
                    name: `${type.toUpperCase()} Card`,
                    doc_type: type,
                    status: 'pending'
                })
                dbError = error
            }

            if (dbError) throw dbError

            // Re-fetch docs to update UI
            await fetchDocs()

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
            setUploadingType(null)
        }
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        if (!formData.full_name || formData.full_name.trim().length < 3) { setError("Full Name is required"); return }

        setSaving(true)
        setMessage(null)
        setError(null)

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    ...formData,
                    updated_at: new Date()
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            setMessage('Profile records updated!')
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
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading Profile...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 pb-20 pt-8">
            {/* Simple Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
                    <p className="text-slate-500 font-medium">Manage your personal and business identity.</p>
                </div>

                <div className="flex items-center gap-4">
                    <AnimatePresence>
                        {message && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-bold">
                                {message}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-bold">
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2">
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="relative inline-block mb-6">
                            <div className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden relative">
                                {uploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80"><Loader2 className="animate-spin text-blue-600" /></div>
                                ) : formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={48} /></div>
                                )}
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-2.5 bg-white rounded-xl shadow-xl border border-slate-100 text-slate-600 hover:text-blue-600 transition-all">
                                <Camera size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{formData.full_name || 'Set Your Name'}</h2>
                        <p className="text-slate-400 text-sm font-medium mb-4">{user.email}</p>
                        <div className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                            {user.role}
                        </div>
                    </div>

                    {/* Quick Stats/Status */}
                    <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                        <Activity className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
                        <div className="relative z-10">
                            <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Account ID</h3>
                            <p className="text-xl font-black mb-6">ATF-{user.id.slice(0, 8).toUpperCase()}</p>

                            <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">KYC Status</h3>
                            <div className="flex items-center gap-2">
                                <Shield size={16} />
                                <span className="font-bold uppercase text-sm">{formData.kyc_status.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>

                    {/* KYC Section */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Shield size={20} /></div>
                                <h3 className="font-black text-slate-900 tracking-tight">Identity Vault</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <DocButton
                                label="AADHAR IDENTITY"
                                onUpload={(f) => handleDocUpload(f, 'aadhar')}
                                uploading={uploadingType === 'aadhar'}
                                exists={!!userDocs.aadhar}
                                status={userDocs.aadhar?.status || 'not_started'}
                                message={message}
                            />
                            <DocButton
                                label="PAN VERIFICATION"
                                onUpload={(f) => handleDocUpload(f, 'pan')}
                                uploading={uploadingType === 'pan'}
                                exists={!!userDocs.pan}
                                status={userDocs.pan?.status || 'not_started'}
                                message={message}
                            />
                        </div>

                        <p className="mt-6 text-[10px] text-slate-400 font-medium leading-relaxed italic">
                            * Documents are encrypted and accessible only for compliance verification.
                        </p>
                    </div>
                </div>

                {/* Form Sections */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Identity Section */}
                    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                            <FileText size={18} className="text-blue-600" />
                            <h3 className="font-bold text-slate-900">Personal Details</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileInput label="Full Legal Name" name="full_name" value={formData.full_name} onChange={handleChange} disabled={!isEditing} placeholder="As per PAN/Aadhar" />
                            <ProfileInput label="Mobile Number" name="mobile_number" value={formData.mobile_number} onChange={handleChange} disabled={!isEditing} placeholder="+91 XXXXX XXXXX" />
                            <ProfileInput label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} disabled={!isEditing} />
                            <ProfileInput label="Mother's Name" name="mothers_name" value={formData.mothers_name} onChange={handleChange} disabled={!isEditing} placeholder="Legal Name" />
                        </div>
                    </section>

                    {/* Address Section */}
                    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                            <MapPin size={18} className="text-emerald-600" />
                            <h3 className="font-bold text-slate-900">Residential Address</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Full Address</label>
                                <textarea name="residential_address" value={formData.residential_address} onChange={handleChange} disabled={!isEditing} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none min-h-[100px] disabled:opacity-50" placeholder="House/Street/Area" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ProfileInput label="City" name="residential_city" value={formData.residential_city} onChange={handleChange} disabled={!isEditing} placeholder="Delhi" />
                                <ProfileInput label="State" name="residential_state" value={formData.residential_state} onChange={handleChange} disabled={!isEditing} placeholder="Delhi" />
                                <ProfileInput label="Pincode" name="residential_pincode" value={formData.residential_pincode} onChange={handleChange} disabled={!isEditing} placeholder="110001" />
                            </div>
                        </div>
                    </section>

                    {/* Business Section (Visible to Clients & Admins) */}
                    {(user.role === 'client' || user.role === 'admin' || user.role === 'superuser') && (
                        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                                <Building size={18} className="text-violet-600" />
                                <h3 className="font-bold text-slate-900">Business Entity Information</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ProfileInput label="Firm/Organization Name" name="organization" value={formData.organization} onChange={handleChange} disabled={!isEditing} placeholder="Company Name" />
                                    <ProfileInput label="GST Number" name="gst_number" value={formData.gst_number} onChange={handleChange} disabled={!isEditing} placeholder="15 Digit GSTIN" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Business Address</label>
                                    <textarea name="business_address" value={formData.business_address} onChange={handleChange} disabled={!isEditing} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none min-h-[100px] disabled:opacity-50" placeholder="Firm Office Address" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ProfileInput label="City" name="business_city" value={formData.business_city} onChange={handleChange} disabled={!isEditing} placeholder="Delhi" />
                                    <ProfileInput label="State" name="business_state" value={formData.business_state} onChange={handleChange} disabled={!isEditing} placeholder="Delhi" />
                                    <ProfileInput label="Pincode" name="business_pincode" value={formData.business_pincode} onChange={handleChange} disabled={!isEditing} placeholder="110001" />
                                </div>
                            </div>
                        </section>
                    )}


                </div>
            </div>
        </div>
    )
}

const ProfileInput = ({ label, disabled, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">{label}</label>
        <input
            {...props}
            disabled={disabled}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all disabled:opacity-50"
        />
    </div>
)

const DocButton = ({ label, onUpload, uploading, exists, status, message }) => {
    const inputId = `upload-${label.toLowerCase().replace(/\s+/g, '-')}`
    const isVerified = status === 'verified'

    return (
        <div className="relative group">
            <input
                type="file"
                className="hidden"
                id={inputId}
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                disabled={uploading || isVerified}
                accept=".pdf,.jpg,.jpeg,.png"
            />
            <label
                htmlFor={inputId}
                className={`flex items-center justify-between p-4 rounded-3xl border transition-all cursor-pointer gap-3 ${uploading ? 'bg-slate-50 border-blue-200 cursor-wait' :
                    isVerified
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700 cursor-default'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-blue-500 hover:shadow-xl'
                    }`}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${uploading ? 'bg-blue-600 text-white animate-pulse' :
                        isVerified ? 'bg-emerald-500 text-white' : 'bg-white shadow-sm text-blue-500'
                        }`}>
                        {uploading ? <Loader2 className="animate-spin" size={18} /> :
                            isVerified ? <CheckCircle size={18} /> : <Shield size={18} />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest block leading-none mb-1 truncate whitespace-nowrap">{label}</span>
                        {uploading ? (
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter whitespace-nowrap">Uploading...</span>
                        ) : isVerified ? (
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter whitespace-nowrap">Verified & Secured</span>
                        ) : exists ? (
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter whitespace-nowrap">Stored • Update Document</span>
                        ) : (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">Not Submitted</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {uploading ? (
                        <div className="flex gap-1">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        </div>
                    ) : isVerified ? (
                        <CheckCircle size={18} className="text-emerald-500" />
                    ) : exists ? (
                        <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Activity size={10} /> Update
                        </div>
                    ) : (
                        <Download size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    )}
                </div>
            </label>

            {/* Success Micro-animation */}
            {message?.includes(label.split(' ')[0]) && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-12 left-0 right-0 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest text-center rounded-xl shadow-lg z-20"
                >
                    Success! {label} Stored
                </motion.div>
            )}
        </div>
    )
}

export default Profile
