import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, MapPin, Building, CreditCard, Save, FileText, CheckCircle, Camera, Loader2, AlertCircle, Calendar, Heart } from 'lucide-react'
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
        avatar_url: ''
    })

    useEffect(() => {
        if (user) fetchProfile()
    }, [user])

    useEffect(() => {
        calculateCompletion()
    }, [formData])

    const calculateCompletion = () => {
        const required = [
            { key: 'full_name', label: 'Full Name' },
            { key: 'phone_number', label: 'Mobile' },
            { key: 'dob', label: 'DOB' },
            { key: 'mothers_name', label: "Mother's Name" },
            { key: 'residential_address', label: 'Address' },
            { key: 'residential_city', label: 'City' },
            { key: 'residential_state', label: 'State' },
            { key: 'residential_pincode', label: 'Pincode' },
            { key: 'business_name', label: 'Business Name' },
            { key: 'avatar_url', label: 'Profile Picture' }
        ]

        const missing = required.filter(f => !formData[f.key] || formData[f.key].toString().trim().length === 0).map(f => f.label)

        setMissingFields(missing)
        const filled = required.length - missing.length
        const total = required.length
        setCompletionPercentage(Math.round((filled / total) * 100))
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
                    avatar_url: data.avatar_url || ''
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

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                if (uploadError.message.includes('bucket not found')) {
                    throw new Error("Storage bucket 'avatars' not found. Please contact admin.")
                }
                throw uploadError
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update State & Auto-Save
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }))

            // Auto-save the new avatar URL to profile
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email, // Use email here too for safety, though only updates generally need ID
                    avatar_url: publicUrl,
                    updated_at: new Date()
                })

            if (updateError) throw updateError

            setMessage('Profile picture updated!')
            setTimeout(() => setMessage(null), 3000)

        } catch (error) {
            console.error('Error uploading avatar:', error)
            setError(error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)
        setError(null)

        try {
            const updates = {
                id: user.id,
                email: user.email, // Fix for "null value in column 'email'" error
                full_name: formData.full_name,
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

                city: formData.residential_city, // Fallback
                state: formData.residential_state, // Fallback
                pincode: formData.residential_pincode, // Fallback

                gst_number: formData.gst_number,
                organization: formData.business_name,
                avatar_url: formData.avatar_url,
                updated_at: new Date()
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert(updates)

            if (updateError) throw updateError

            setMessage('Profile updated successfully!')
            setIsEditing(false)
            setTimeout(() => setMessage(null), 3000)

        } catch (err) {
            console.error('Error updating profile:', err)
            setError(`Failed to save profile: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column: Avatar & Completion Status */}
                <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center relative overflow-hidden"
                    >
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden"
                            disabled={uploading}
                        />

                        <div className="relative inline-block mb-4">
                            <div className="w-32 h-32 rounded-full border-4 border-blue-50 dark:border-blue-900/30 overflow-hidden mx-auto bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                {uploading ? (
                                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                ) : formData.avatar_url ? (
                                    <img
                                        src={formData.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            setFormData({ ...formData, avatar_url: '' });
                                        }}
                                    />
                                ) : (
                                    <User size={64} className="text-gray-400" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <Camera size={18} />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {formData.full_name || 'Your Name'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate px-4">
                            {user.email}
                        </p>

                        <div className="inline-flex items-center px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                            <CheckCircle size={14} className="mr-1.5" />
                            Verified Account
                        </div>
                    </motion.div>

                    {/* Completion Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
                    >
                        <h3 className="text-lg font-bold mb-4">Profile Completion</h3>

                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-white">
                                        {completionPercentage}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-white/20">
                                <div style={{ width: `${completionPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white transition-all duration-500"></div>
                            </div>
                        </div>

                        <p className="text-sm text-blue-100 leading-relaxed">
                            {completionPercentage === 100
                                ? "Great job! Your profile is fully complete."
                                : (
                                    <span>
                                        You need to complete: <br />
                                        <span className="font-semibold text-white/90 text-xs">
                                            {missingFields.slice(0, 3).join(', ')}
                                            {missingFields.length > 3 && `, +${missingFields.length - 3} more`}
                                        </span>
                                    </span>
                                )
                            }
                        </p>
                    </motion.div>
                </div>

                {/* Right Column: Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            Personal & Business Details
                        </h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                Edit Details
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {message && (
                            <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center border border-green-100">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {error}
                            </div>
                        )}

                        {/* Personal Info Group */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Personal Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                            placeholder="+91 99999 99999"
                                        />
                                    </div>
                                </div>

                                {/* DOB */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Mother's Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mother's Name</label>
                                    <div className="relative">
                                        <Heart className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="mothers_name"
                                            value={formData.mothers_name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                            placeholder="Mother's Name"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-700" />

                        {/* RESIDENTIAL ADDRESS SECTION */}
                        <div className="space-y-6">
                            <div className="flex items-center text-blue-600">
                                <MapPin size={20} className="mr-2" />
                                <h4 className="text-sm font-bold uppercase tracking-wider">Residential Address</h4>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                                <textarea
                                    name="residential_address"
                                    value={formData.residential_address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    rows="2"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all resize-none"
                                    placeholder="Your Home/Residential Address"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                                    <input type="text" name="residential_city" value={formData.residential_city} onChange={handleChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-50" placeholder="City" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                                    <input type="text" name="residential_state" value={formData.residential_state} onChange={handleChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-50" placeholder="State" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pincode</label>
                                    <input type="text" name="residential_pincode" value={formData.residential_pincode} onChange={handleChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-50" placeholder="000000" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-700" />

                        {/* BUSINESS ADDRESS SECTION */}
                        <div className="space-y-6">
                            <div className="flex items-center text-purple-600">
                                <Building size={20} className="mr-2" />
                                <h4 className="text-sm font-bold uppercase tracking-wider">Business Address & Details</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business / Shop Name</label>
                                    <input
                                        type="text"
                                        name="business_name"
                                        value={formData.business_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                        placeholder="Your Business Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GST Number (Optional)</label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={formData.gst_number}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Office Street Address</label>
                                <textarea
                                    name="business_address"
                                    value={formData.business_address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    rows="2"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all resize-none"
                                    placeholder="Your Office/Shop Address"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business City</label>
                                    <input type="text" name="business_city" value={formData.business_city} onChange={handleChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-50" placeholder="City" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business State</label>
                                    <input type="text" name="business_state" value={formData.business_state} onChange={handleChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-50" placeholder="State" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Pincode</label>
                                    <input type="text" name="business_pincode" value={formData.business_pincode} onChange={handleChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-50" placeholder="000000" />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {isEditing && (
                            <div className="flex justify-end pt-6 space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </motion.div>
            </div>
        </div>
    )
}

export default Profile
