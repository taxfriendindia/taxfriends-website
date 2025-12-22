import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Briefcase, MessageSquare, Save, Mail, MapPin, Calendar, Clock, Bell, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ClientDetailsModal = ({ client, isOpen, onClose, onUpdate, currentUser }) => {
    const [activeTab, setActiveTab] = useState('profile') // profile, services, message
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({})
    const [services, setServices] = useState([])
    const [loadingServices, setLoadingServices] = useState(false)
    const [message, setMessage] = useState('')
    const [sendingMsg, setSendingMsg] = useState(false)
    const [roleModal, setRoleModal] = useState({ isOpen: false, newRole: null, action: '' })
    const [confirmInput, setConfirmInput] = useState('')

    useEffect(() => {
        if (client) {
            setFormData(client)
            fetchServices(client.id)
            setIsEditing(false)
            setMessage('')
            setActiveTab('profile')
        }
    }, [client])

    const handleRoleToggle = (newRole) => {
        if (newRole === client.role) return

        const roles = { admin: 'Admin', partner: 'City Partner', client: 'Client' }
        const action = `CHANGE Role to ${roles[newRole] || newRole}`
        setRoleModal({ isOpen: true, newRole, action })
        setConfirmInput('')
    }

    const executeRoleChange = async () => {
        if (confirmInput.toLowerCase() !== 'confirm') {
            alert('You must type "confirm" to proceed.')
            return
        }

        try {
            // Use RPC function to safely update role (bypassing RLS complexity)
            const { error } = await supabase.rpc('update_user_role', {
                target_user_id: client.id,
                new_role: roleModal.newRole
            })

            if (error) throw error

            alert(`User role updated to ${roleModal.newRole.toUpperCase()}. All existing data is preserved.`)
            onUpdate({ ...client, role: roleModal.newRole })
            setRoleModal({ isOpen: false, newRole: null, action: '' })
        } catch (error) {
            console.error('Error changing role:', error)
            alert(`Failed to change role: ${error.message}`)
        }
    }

    const fetchServices = async (userId) => {
        setLoadingServices(true)
        try {
            // 1. Fetch User Services
            const { data: userServices, error: usError } = await supabase
                .from('user_services')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (usError) throw usError

            if (!userServices || userServices.length === 0) {
                setServices([])
                return
            }

            // 2. Fetch Service Details from Catalog
            const serviceIds = [...new Set(userServices.map(s => s.service_id))]
            const { data: catalog, error: cError } = await supabase
                .from('service_catalog')
                .select('id, title')
                .in('id', serviceIds)

            if (cError) throw cError

            const catalogMap = (catalog || []).reduce((acc, item) => ({ ...acc, [item.id]: item }), {})

            // 3. Merge
            const joined = userServices.map(s => ({
                ...s,
                title: catalogMap[s.service_id]?.title || 'Unknown Service'
            }))

            setServices(joined)
        } catch (error) {
            console.error('Error fetching services:', error)
            setServices([])
        } finally {
            setLoadingServices(false)
        }
    }

    const handleSave = async () => {
        try {
            // Filter only updatable fields to prevent RLS errors on ID/Email/Role
            const updatableFields = [
                'full_name', 'mobile_number', 'mothers_name', 'dob',
                'organization', 'gst_number',
                'residential_address', 'residential_city', 'residential_state', 'residential_pincode',
                'business_address', 'business_city', 'business_state', 'business_pincode',
                'avatar_url'
            ]

            const updateData = {}
            updatableFields.forEach(field => {
                if (formData[field] !== undefined) {
                    updateData[field] = formData[field]
                }
            })

            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', client.id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) throw new Error('Update blocked by Security Policies (RLS).')

            onUpdate({ ...client, ...updateData }) // Update parent state with merged data
            setIsEditing(false)
            alert('Profile updated successfully!')
        } catch (error) {
            console.error('Error updating profile:', error)
            alert(`Failed to update profile: ${error.message || 'Check permissions'}`)
        }
    }

    const handleSendNotification = async () => {
        if (!message.trim()) return

        setSendingMsg(true)
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: client.id,
                    title: 'Message from Admin',
                    message: message,
                    type: 'info',
                    is_read: false,
                    created_at: new Date()
                }])

            if (error) throw error

            alert('Notification sent to user successfully!')
            setMessage('')
        } catch (error) {
            console.error('Error sending notification:', error)
            alert('Failed to send notification.')
        } finally {
            setSendingMsg(false)
        }
    }

    if (!isOpen || !client) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
                >
                    {/* Role Confirmation Modal Overlay */}
                    {roleModal.isOpen && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-slate-200 ring-1 ring-black/5"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                                        <Bell size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Role Change</h3>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Are you sure you want to <strong>{roleModal.action}</strong>?<br />
                                        This grants or removes sensitive access permissions.
                                    </p>

                                    <div className="w-full mb-6 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                            Type 'confirm' to continue
                                        </label>
                                        <input
                                            type="text"
                                            value={confirmInput}
                                            onChange={(e) => setConfirmInput(e.target.value)}
                                            className="w-full bg-white px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                                            placeholder="confirm"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={() => setRoleModal({ ...roleModal, isOpen: false })}
                                            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={executeRoleChange}
                                            disabled={confirmInput.toLowerCase() !== 'confirm'}
                                            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl overflow-hidden shadow-sm border-2 border-white">
                                {client.avatar_url ? (
                                    <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    (client.full_name?.charAt(0) || '?').toUpperCase()
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{client.full_name}</h2>
                                <p className="text-slate-500 text-sm flex items-center">
                                    <Mail size={12} className="mr-1" /> {client.email}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Profile Info" />
                        <TabButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={Briefcase} label={`Services (${services.length})`} />
                        <TabButton active={activeTab === 'message'} onClick={() => setActiveTab('message')} icon={Bell} label="Send Notification" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800 text-lg">Personal & Business Details</h3>

                                    <div className="flex items-center gap-4">
                                        {/* Superuser Role Management */}
                                        {currentUser?.role === 'superuser' && client.role !== 'superuser' && (
                                            <div className="flex flex-col items-start gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                                <span className="text-[9px] font-black text-slate-400 px-2 uppercase tracking-tighter">User Privileges</span>
                                                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm gap-1">
                                                    <button
                                                        onClick={() => handleRoleToggle('client')}
                                                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${client.role === 'client'
                                                            ? 'bg-blue-600 text-white shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        Client
                                                    </button>
                                                    <button
                                                        onClick={() => handleRoleToggle('partner')}
                                                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${client.role === 'partner'
                                                            ? 'bg-emerald-600 text-white shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        Partner
                                                    </button>
                                                    <button
                                                        onClick={() => handleRoleToggle('admin')}
                                                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${client.role === 'admin'
                                                            ? 'bg-emerald-600 text-white shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        Admin
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {currentUser?.role === 'superuser' && (
                                            !isEditing ? (
                                                <button onClick={() => setIsEditing(true)} className="text-emerald-600 font-semibold hover:underline text-sm flex items-center">
                                                    <EditIcon size={16} className="mr-1" /> Edit Profile
                                                </button>
                                            ) : (
                                                <div className="flex space-x-3">
                                                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700 text-sm font-medium">Cancel</button>
                                                    <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 flex items-center">
                                                        <Save size={14} className="mr-1.5" /> Save Changes
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Form Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label="Full Name" name="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} disabled={!isEditing} />
                                    <InputGroup label="Mobile Number" name="mobile" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} disabled={!isEditing} />
                                    <InputGroup label="Mother's Name" name="mothers_name" value={formData.mothers_name} onChange={(e) => setFormData({ ...formData, mothers_name: e.target.value })} disabled={!isEditing} />
                                    <InputGroup label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} disabled={!isEditing} />

                                    <div className="md:col-span-2 border-t border-slate-100 my-2"></div>

                                    <InputGroup label="Organization / Business Name" name="organization" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} disabled={!isEditing} />
                                    <InputGroup label="GST Number" name="gst_number" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} disabled={!isEditing} />

                                    <div className="md:col-span-2 border-t border-slate-100 my-2"></div>

                                    <div className="md:col-span-2">
                                        <h4 className="font-bold text-slate-700 mb-3 flex items-center"><MapPin size={16} className="mr-2" /> Residential Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <InputGroup label="Address Line" className="md:col-span-3" name="residential_address" value={formData.residential_address} onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })} disabled={!isEditing} />
                                            <InputGroup label="City" name="residential_city" value={formData.residential_city} onChange={(e) => setFormData({ ...formData, residential_city: e.target.value })} disabled={!isEditing} />
                                            <InputGroup label="State" name="residential_state" value={formData.residential_state} onChange={(e) => setFormData({ ...formData, residential_state: e.target.value })} disabled={!isEditing} />
                                            <InputGroup label="Pincode" name="residential_pincode" value={formData.residential_pincode} onChange={(e) => setFormData({ ...formData, residential_pincode: e.target.value })} disabled={!isEditing} />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <h4 className="font-bold text-slate-700 mb-3 flex items-center"><Briefcase size={16} className="mr-2" /> Business Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <InputGroup label="Address Line" className="md:col-span-3" name="business_address" value={formData.business_address} onChange={(e) => setFormData({ ...formData, business_address: e.target.value })} disabled={!isEditing} />
                                            <InputGroup label="City" name="business_city" value={formData.business_city} onChange={(e) => setFormData({ ...formData, business_city: e.target.value })} disabled={!isEditing} />
                                            <InputGroup label="State" name="business_state" value={formData.business_state} onChange={(e) => setFormData({ ...formData, business_state: e.target.value })} disabled={!isEditing} />
                                            <InputGroup label="Pincode" name="business_pincode" value={formData.business_pincode} onChange={(e) => setFormData({ ...formData, business_pincode: e.target.value })} disabled={!isEditing} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'services' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 text-lg mb-4">Requested Services History</h3>
                                {loadingServices ? (
                                    <div className="text-center py-10 text-slate-500">Loading services...</div>
                                ) : services.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                                        No services requested yet.
                                    </div>
                                ) : (
                                    services.map((svc) => (
                                        <div key={svc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{svc.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                    <Calendar size={12} className="mr-1" />
                                                    {new Date(svc.created_at).toLocaleDateString()}
                                                    <Clock size={12} className="ml-3 mr-1" />
                                                    {new Date(svc.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${svc.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                svc.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {svc.status || 'pending'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'message' && (
                            <div className="flex flex-col h-full">
                                <h3 className="font-bold text-slate-800 text-lg mb-2">Send Notification</h3>
                                <p className="text-slate-500 text-sm mb-6">Send a direct in-app notification to the user's notification center.</p>

                                <textarea
                                    className="flex-1 w-full bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none shadow-sm mb-4"
                                    placeholder="Type your notification message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                ></textarea>

                                <button
                                    onClick={handleSendNotification}
                                    disabled={!message.trim() || sendingMsg}
                                    className="bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} className="mr-2" /> {sendingMsg ? 'Sending...' : 'Send Notification'}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 flex items-center justify-center font-medium text-sm transition-colors border-b-2 ${active ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
    >
        <Icon size={18} className="mr-2" /> {label}
    </button>
)

const InputGroup = ({ label, disabled, className = "", ...props }) => (
    <div className={className}>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
        <input
            className={`w-full px-3 py-2.5 rounded-lg border ${disabled ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500'
                } outline-none transition-all text-sm font-medium`}
            disabled={disabled}
            {...props}
        />
    </div>
)

// Edit Icon Helper since 'Edit' is already imported as component
const EditIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
)

export default ClientDetailsModal
