import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, Wallet, Clock, CheckCircle2, XCircle,
    Search, Filter, ChevronRight, Eye, MoreVertical,
    ArrowUpRight, Download, Mail, Phone, AlertCircle, Ban,
    ExternalLink, Edit, DollarSign, IndianRupee, Copy, X, Save, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../../services/userService';

const AdminPartners = () => {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superuser';
    const navigate = useNavigate();

    const [partners, setPartners] = useState([]);
    const [payoutRequests, setPayoutRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('directory'); // Default to directory to show all partners
    const [filters, setFilters] = useState({ state: 'All', city: 'All' });
    const [stats, setStats] = useState({
        total: 0,
        pendingKyc: 0,
        pendingPayouts: 0,
        totalRoyalties: 0
    });

    // Modal States
    const [modalConfig, setModalConfig] = useState({
        type: null, // 'contact', 'wallet', 'verify', 'edit'
        partner: null,
        data: {}
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const { data: partnersData, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .or('role.ilike.partner') // Use ilike for case-insensitivity
                .order('created_at', { ascending: false });

            if (pError) throw pError;
            setPartners(partnersData || []);

            const { data: payoutsData, error: pyError } = await supabase
                .from('payout_requests')
                .select('*, partner:partner_id(full_name, email, wallet_balance, kyc_status)')
                .order('created_at', { ascending: false });

            if (pyError) throw pyError;
            setPayoutRequests(payoutsData || []);

            setStats({
                total: partnersData?.length || 0,
                pendingKyc: partnersData?.filter(p => p.kyc_status === 'pending').length || 0,
                pendingPayouts: payoutsData?.filter(p => p.status === 'pending').length || 0,
                totalRoyalties: partnersData?.reduce((acc, curr) => acc + (curr.wallet_balance || 0), 0)
            });

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateKyc = async (partnerId, status) => {
        if (!isSuperAdmin) return;

        try {
            setLoading(true);
            const { error } = await supabase.rpc('verify_partner_kyc', {
                target_partner_id: partnerId,
                new_status: status
            });

            if (error) throw error;
            setModalConfig({ type: null, partner: null, data: {} });
            await fetchData();
        } catch (error) {
            console.error('KYC Update Error:', error);
            alert('Failed to update KYC status: ' + (error.message || 'Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePayout = async (payoutId, status) => {
        if (!isSuperAdmin) return;

        try {
            const payout = payoutRequests.find(p => p.id === payoutId);

            // Check if completing and if partner is KYC verified
            if (status === 'completed') {
                if (payout?.partner?.kyc_status !== 'verified') {
                    alert('Cannot complete payout: Partner KYC is not verified.');
                    return;
                }
            }

            const { error } = await supabase
                .from('payout_requests')
                .update({
                    status: status,
                    processed_at: new Date().toISOString()
                })
                .eq('id', payoutId);

            if (error) throw error;

            // Send notification to partner
            const title = status === 'completed' ? "Payout Processed ✅" : "Payout Rejected ❌";
            const message = status === 'completed'
                ? `Your payout request for ₹${payout.amount} has been successfully processed and transferred.`
                : `Your payout request for ₹${payout.amount} was rejected. Please contact support for details.`;

            await UserService.createNotification(payout.partner_id, title, message, status === 'completed' ? 'success' : 'error');

            fetchData();
        } catch (error) {
            console.error('Payout Update Error:', error);
        }
    };

    const handleWalletAdjustment = async (partnerId, currentBalance, amount, reason = '') => {
        if (!isSuperAdmin) return;
        if (!amount || isNaN(amount) || amount === 0) return;

        try {
            const newBalance = parseFloat(currentBalance || 0) + parseFloat(amount);

            // 1. Update Profile Balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ wallet_balance: newBalance })
                .eq('id', partnerId);

            if (balanceError) throw balanceError;

            // 2. Log in partner_royalties for history visibility
            // We use 'adjustment' type (from migration 06)
            await supabase.from('partner_royalties').insert([{
                partner_id: partnerId,
                amount: amount,
                type: 'adjustment',
                status: 'available',
                verified_at: new Date().toISOString()
            }]);

            // 3. Send notification to partner
            const title = amount > 0 ? "Wallet Credited" : "Wallet Debited";
            const message = amount > 0
                ? `₹${amount} has been added to your wallet.`
                : `₹${Math.abs(amount)} has been deducted from your wallet. Reason: ${reason || 'Administrative Adjustment'}`;

            await UserService.createNotification(partnerId, title, message, amount > 0 ? 'success' : 'warning');

            // Force immediate UI update
            setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, wallet_balance: newBalance } : p));
            setModalConfig({ type: null, partner: null, data: {} });

            // Give Supabase a moment to reflect changes before re-fetching
            setTimeout(() => fetchData(), 500);
        } catch (error) {
            console.error('Wallet Adjustment Error:', error);
            alert('Failed to adjust wallet: ' + error.message);
        }
    };

    const handleUpdatePartner = async (partnerId, updateData) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', partnerId);

            if (error) throw error;

            setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, ...updateData } : p));
            setModalConfig({ type: null, partner: null, data: {} });
            alert('Partner profile updated successfully');
        } catch (error) {
            console.error('Update Partner Error:', error);
            alert('Failed to update partner: ' + error.message);
        }
    };

    const uniqueStates = useMemo(() => {
        const states = partners.map(p => p.residential_state || p.business_state).filter(Boolean);
        return ['All', ...new Set(states)].sort();
    }, [partners]);

    const uniqueCities = useMemo(() => {
        const relevant = filters.state === 'All'
            ? partners
            : partners.filter(p => (p.residential_state === filters.state || p.business_state === filters.state));
        const cities = relevant.map(p => p.residential_city || p.business_city).filter(Boolean);
        return ['All', ...new Set(cities)].sort();
    }, [partners, filters.state]);

    const filteredPartners = partners.filter(p => {
        const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (filters.state !== 'All') {
            const pState = p.residential_state || p.business_state;
            if (pState !== filters.state) return false;
        }

        if (filters.city !== 'All') {
            const pCity = p.residential_city || p.business_city;
            if (pCity !== filters.city) return false;
        }

        return true;
    });

    const pendingKycList = partners.filter(p => p.kyc_status === 'pending');
    const pendingPayoutsList = payoutRequests.filter(p => p.status === 'pending');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Partner Management</h1>
                    <p className="text-slate-500 font-medium">Manage franchise partners, KYC verifications, and payouts.</p>
                </div>
                {!isSuperAdmin && (
                    <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
                        <Ban size={16} /> Restricted to Super Admin
                    </div>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Total Partners" value={stats.total} color="emerald" />
                <StatCard icon={Shield} label="Pending KYC" value={stats.pendingKyc} color="emerald" />
                <StatCard icon={Wallet} label="Pending Payouts" value={stats.pendingPayouts} color="emerald" />
                <StatCard icon={Clock} label="Avg. Approval" value="2.4h" color="emerald" />
            </div>

            {/* Tabs & Search */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
                    <div className="flex bg-white p-1 rounded-2xl shadow-inner border border-slate-200/50 self-start">
                        <TabButton active={activeTab === 'kyc'} onClick={() => setActiveTab('kyc')} label="KYC Requests" count={stats.pendingKyc} />
                        <TabButton active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} label="Payouts" count={stats.pendingPayouts} />
                        <TabButton active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} label="All Partners" />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search partners by name, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                            />
                        </div>

                        {activeTab === 'directory' && (
                            <div className="flex flex-wrap gap-4">
                                <SearchDropdown
                                    label="State"
                                    value={filters.state}
                                    options={uniqueStates}
                                    onChange={(v) => setFilters(f => ({ ...f, state: v, city: 'All' }))}
                                />
                                <SearchDropdown
                                    label="City"
                                    value={filters.city}
                                    options={uniqueCities}
                                    onChange={(v) => setFilters(f => ({ ...f, city: v }))}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'kyc' && (
                            <motion.div
                                key="kyc"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="divide-y divide-slate-100"
                            >
                                {pendingKycList.length === 0 ? (
                                    <EmptyState icon={CheckCircle2} title="All Caught Up" desc="No pending KYC requests at the moment." />
                                ) : (
                                    pendingKycList.map(item => (
                                        <PartnerRow
                                            key={item.id}
                                            partner={item}
                                            type="kyc"
                                            onUpdate={handleUpdateKyc}
                                            isSuperAdmin={isSuperAdmin}
                                            onWalletAdj={(pId, bal) => setModalConfig({ type: 'wallet', partner: item, data: { balance: bal } })}
                                            onContact={(p) => setModalConfig({ type: 'contact', partner: p })}
                                            onVerify={(p) => setModalConfig({ type: 'verify', partner: p })}
                                            fetchData={fetchData}
                                        />
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'payouts' && (
                            <motion.div
                                key="payouts"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="divide-y divide-slate-100"
                            >
                                {pendingPayoutsList.length === 0 ? (
                                    <EmptyState icon={Wallet} title="Clean Slate" desc="No pending payout requests found." />
                                ) : (
                                    pendingPayoutsList.map(item => (
                                        <PayoutRow key={item.id} request={item} onUpdate={handleUpdatePayout} isSuperAdmin={isSuperAdmin} />
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'directory' && (
                            <motion.div
                                key="directory"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="divide-y divide-slate-100"
                            >
                                {filteredPartners.map(item => (
                                    <PartnerRow
                                        key={item.id}
                                        partner={item}
                                        type="directory"
                                        onUpdate={handleUpdateKyc}
                                        isSuperAdmin={isSuperAdmin}
                                        onWalletAdj={(pId, bal) => setModalConfig({ type: 'wallet', partner: item, data: { balance: bal } })}
                                        onContact={(p) => setModalConfig({ type: 'contact', partner: p })}
                                        onVerify={(p) => setModalConfig({ type: 'verify', partner: p })}
                                        onEdit={(p) => setModalConfig({ type: 'edit', partner: p })}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Luxury Modals */}
            <AnimatePresence>
                {modalConfig.type === 'contact' && (
                    <ContactModal
                        partner={modalConfig.partner}
                        onClose={() => setModalConfig({ type: null, partner: null, data: {} })}
                    />
                )}
                {modalConfig.type === 'wallet' && (
                    <WalletModal
                        partner={modalConfig.partner}
                        onClose={() => setModalConfig({ type: null, partner: null, data: {} })}
                        onConfirm={(amount, reason) => handleWalletAdjustment(modalConfig.partner.id, modalConfig.partner.wallet_balance, amount, reason)}
                    />
                )}
                {modalConfig.type === 'verify' && (
                    <ConfirmModal
                        title="Force Verify KYC"
                        message={`CRITICAL: You are about to bypass document verification for ${modalConfig.partner.full_name}. This will grant them full platform authority.`}
                        warning="This action is logged and should only be used if documents were verified offline."
                        onClose={() => setModalConfig({ type: null, partner: null, data: {} })}
                        onConfirm={() => handleUpdateKyc(modalConfig.partner.id, 'verified')}
                    />
                )}
                {modalConfig.type === 'edit' && (
                    <PartnerEditModal
                        partner={modalConfig.partner}
                        onClose={() => setModalConfig({ type: null, partner: null, data: {} })}
                        onSave={(data) => handleUpdatePartner(modalConfig.partner.id, data)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        blue: 'from-blue-50 to-indigo-50 text-blue-600 border-blue-100',
        amber: 'from-amber-50 to-orange-50 text-amber-600 border-amber-100',
        indigo: 'from-indigo-50 to-violet-50 text-indigo-600 border-indigo-100',
        emerald: 'from-emerald-50 to-teal-50 text-emerald-600 border-emerald-100'
    };

    return (
        <div className={`bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-30 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500`} />
            <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 bg-white border rounded-2xl shadow-sm ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <div className="text-2xl font-black text-slate-900">{value}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, label, count }) => (
    <button
        onClick={onClick}
        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-emerald-600'
            }`}
    >
        {label}
        {count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                {count}
            </span>
        )}
    </button>
);

const PartnerRow = ({ partner, type, onUpdate, isSuperAdmin, onWalletAdj, onContact, onVerify, onEdit }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 hover:bg-slate-50/50 transition-colors group relative">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-base md:text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    {partner.full_name?.[0] || 'P'}
                </div>
                <div className="min-w-0">
                    <div className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2 truncate">
                        {partner.full_name || 'Anonymous Partner'}
                        {partner.kyc_status === 'verified' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 truncate"><Mail size={10} /> {partner.email}</span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Phone size={10} /> {partner.mobile_number || 'No number'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-4 md:gap-8 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                <div className="text-left lg:text-right flex items-center gap-3">
                    <button
                        onClick={() => onWalletAdj(partner.id, partner.wallet_balance)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                        <IndianRupee size={16} />
                    </button>
                    <div>
                        <div className="text-xs font-black text-slate-700">₹{partner.wallet_balance || 0}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {type === 'kyc' ? (
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all" title="View Documents">
                                <Eye size={18} />
                            </button>
                            {isSuperAdmin ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onUpdate(partner.id, 'verified')}
                                        className="px-3 md:px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] md:text-xs font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => onUpdate(partner.id, 'rejected')}
                                        className="px-3 md:px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] md:text-xs font-black hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                    >
                                        Reject
                                    </button>
                                </div>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-2">Read Only</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 relative">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${partner.kyc_status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-500 font-black' :
                                partner.kyc_status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-slate-50 text-slate-400 border-slate-200'
                                }`}>
                                {partner.kyc_status?.replace('_', ' ') || 'not started'}
                            </span>

                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
                                >
                                    <MoreVertical size={18} />
                                </button>

                                <AnimatePresence>
                                    {showMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden p-2"
                                        >
                                            <MenuButton icon={Mail} label="Contact Partner" onClick={() => { setShowMenu(false); onContact(partner); }} />
                                            {isSuperAdmin && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-1" />
                                                    <MenuButton
                                                        icon={IndianRupee}
                                                        label="Adjust Wallet"
                                                        onClick={() => { setShowMenu(false); onWalletAdj(partner.id, partner.wallet_balance); }}
                                                        color="text-emerald-600"
                                                    />
                                                    <MenuButton
                                                        icon={Edit}
                                                        label="Edit Profile"
                                                        onClick={() => { setShowMenu(false); onEdit(partner); }}
                                                    />
                                                    <MenuButton
                                                        icon={Shield}
                                                        label="Force Verify KYC"
                                                        onClick={() => { setShowMenu(false); onVerify(partner); }}
                                                        color="text-rose-600"
                                                    />
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContactModal = ({ partner, onClose }) => {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative z-10 border border-slate-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-3xl mb-4 border border-emerald-100">
                        {partner.full_name?.[0]}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{partner.full_name}</h3>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Direct Contact Details</p>
                </div>

                <div className="space-y-4">
                    <ContactField icon={Mail} label="Email Address" value={partner.email} onCopy={() => copyToClipboard(partner.email)} />
                    <ContactField icon={Phone} label="Mobile Number" value={partner.mobile_number || 'Not provided'} onCopy={() => copyToClipboard(partner.mobile_number)} />
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    <a href={`mailto:${partner.email}`} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                        <Mail size={16} /> Send Email
                    </a>
                    <a href={`tel:${partner.mobile_number}`} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200">
                        <Phone size={16} /> Call Now
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

const ContactField = ({ icon: Icon, label, value, onCopy }) => (
    <div className="bg-slate-50 p-4 rounded-2xl group border border-slate-100 hover:border-emerald-200 transition-all">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</label>
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 truncate">
                <Icon size={16} className="text-emerald-600" />
                <span className="font-bold text-slate-700 text-sm truncate">{value}</span>
            </div>
            <button onClick={onCopy} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                <Copy size={14} />
            </button>
        </div>
    </div>
);

const WalletModal = ({ partner, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState('credit'); // 'credit', 'debit'

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative z-10 border border-slate-100 overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Adjust Balance</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={60} /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Wallet</p>
                    <p className="text-3xl font-black">₹{partner.wallet_balance || 0}</p>
                </div>

                <div className="space-y-6">
                    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                        <button onClick={() => setType('credit')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${type === 'credit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Add Funds</button>
                        <button onClick={() => setType('debit')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${type === 'debit' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Deduction</button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Amount</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full h-[60px] bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                                />
                            </div>
                        </div>

                        {type === 'debit' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-rose-500">Reason for Deduction*</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Type penalty or correction reason..."
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onConfirm(type === 'credit' ? parseFloat(amount) : -parseFloat(amount), reason)}
                        disabled={!amount || (type === 'debit' && !reason)}
                        className={`w-full h-[64px] rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:grayscale ${type === 'credit' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-rose-600 text-white shadow-rose-200'}`}
                    >
                        <Save size={18} /> {type === 'credit' ? 'Confirm Addition' : 'Confirm Deduction'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ConfirmModal = ({ title, message, warning, onClose, onConfirm }) => {
    const [processing, setProcessing] = useState(false);

    const handleConfirm = async () => {
        setProcessing(true);
        await onConfirm();
        setProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative z-10 border border-slate-100 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-6">
                    {processing ? <Loader2 className="animate-spin" size={32} /> : <AlertCircle size={32} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4">{message}</p>
                {warning && (
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-8">
                        ⚠️ {warning}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onClose} disabled={processing} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50">No, Cancel</button>
                    <button onClick={handleConfirm} disabled={processing} className="py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-2">
                        {processing ? 'Processing...' : 'Yes, Proceed'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const MenuButton = ({ icon: Icon, label, onClick, color = "text-slate-600" }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs ${color}`}
    >
        <Icon size={16} />
        {label}
    </button>
);

const PayoutRow = ({ request, onUpdate, isSuperAdmin }) => (
    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <Wallet size={24} />
            </div>
            <div>
                <div className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    ₹{request.amount} Withdrawal Request
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Users size={10} /> {request.partner?.full_name}</span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><ArrowUpRight size={10} /> {request.recipient_details}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
                <div className="text-xs font-black text-slate-700">{new Date(request.created_at).toLocaleDateString()}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Request Date</div>
            </div>

            <div className="flex items-center gap-2">
                {isSuperAdmin ? (
                    <>
                        <button
                            onClick={() => onUpdate(request.id, 'completed')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Complete
                        </button>
                        <button
                            onClick={() => onUpdate(request.id, 'rejected')}
                            className="px-4 py-2 bg-white text-rose-600 border border-rose-100 rounded-xl text-xs font-black hover:bg-rose-50 transition-all"
                        >
                            Reject
                        </button>
                    </>
                ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pending Verification</span>
                )}
            </div>
        </div>
    </div>
);

const SearchDropdown = ({ label, value, options, onChange }) => (
    <div className="flex items-center gap-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}:</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
        >
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const EmptyState = ({ icon: Icon, title, desc }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
            <Icon size={32} />
        </div>
        <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
        <p className="text-slate-400 text-sm font-medium mt-1">{desc}</p>
    </div>
);

const PartnerEditModal = ({ partner, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...partner });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl relative z-10 border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Modify Partner</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Editing profile for {partner.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                            <input
                                type="text"
                                value={formData.mobile_number}
                                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Card Number</label>
                            <input
                                type="text"
                                value={formData.pan_number || ''}
                                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all uppercase"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhar Number</label>
                            <input
                                type="text"
                                value={formData.aadhar_number || ''}
                                onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2">Location Identity</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                                <input
                                    type="text"
                                    value={formData.residential_city || ''}
                                    onChange={(e) => setFormData({ ...formData, residential_city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                                <input
                                    type="text"
                                    value={formData.residential_state || ''}
                                    onChange={(e) => setFormData({ ...formData, residential_state: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.residential_pincode || ''}
                                    onChange={(e) => setFormData({ ...formData, residential_pincode: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Discard</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminPartners;
