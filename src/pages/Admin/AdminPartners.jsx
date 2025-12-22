import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, Wallet, Clock, CheckCircle2, XCircle,
    Search, Filter, ChevronRight, Eye, MoreVertical,
    ArrowUpRight, Download, Mail, Phone, AlertCircle, Ban,
    ExternalLink, Edit, DollarSign, IndianRupee, Copy, X, Save, Loader2, FileText, Trash2, Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../../services/userService';
import StatusModal from '../../components/StatusModal';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminPartners = ({ initialTab }) => {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superuser';
    const navigate = useNavigate();

    const [partners, setPartners] = useState([]);
    const [payoutRequests, setPayoutRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(initialTab || 'directory');

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    const [filters, setFilters] = useState({ state: 'All', city: 'All' });
    const [stats, setStats] = useState({
        total: 0,
        pendingKyc: 0,
        pendingPayouts: 0,
        totalApprovedPayouts: 0
    });

    // Modal States
    const [modalConfig, setModalConfig] = useState({
        type: null, // 'contact', 'wallet', 'verify', 'edit'
        partner: null,
        data: {}
    });

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        danger: false
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
                totalApprovedPayouts: payoutsData?.filter(p => p.status === 'completed').reduce((acc, curr) => acc + (curr.amount || 0), 0)
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
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'KYC Updated',
                message: `Partner status has been updated to ${status.toUpperCase()} successfully.`
            });
        } catch (error) {
            console.error('KYC Update Error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Operation Failed',
                message: error.message || 'Failed to update KYC status.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePayout = async (payoutId, status) => {
        if (!isSuperAdmin) return;

        const payout = payoutRequests.find(p => p.id === payoutId);

        if (status === 'completed') {
            if (payout?.partner?.kyc_status !== 'verified') {
                setStatusModal({
                    isOpen: true,
                    type: 'warning',
                    title: 'KYC Required',
                    message: 'Cannot complete payout: Partner KYC is not verified.'
                });
                return;
            }
        }

        try {
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
            setStatusModal({
                isOpen: true,
                type: status === 'completed' ? 'success' : 'error',
                title: status === 'completed' ? 'Payout Success' : 'Payout Rejected',
                message: status === 'completed' ? 'Funds have been settled successfully.' : 'Request has been moved to history.'
            });
        } catch (error) {
            console.error('Payout Update Error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Critical Error',
                message: 'Failed to update payout request.'
            });
        }
    };

    const handleDeletePartner = async (partnerId) => {
        if (!isSuperAdmin) return;

        setConfirmModal({
            isOpen: true,
            title: 'Expel Partner?',
            message: 'CRITICAL: This will permanently remove the partner profile and all linked client records. This action cannot be reversed. Continue?',
            danger: true,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    const { error } = await supabase
                        .from('profiles')
                        .delete()
                        .eq('id', partnerId);

                    if (error) throw error;

                    setPartners(prev => prev.filter(p => p.id !== partnerId));
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        title: 'Partner Expelled',
                        message: 'The partner has been permanently removed.'
                    });
                } catch (error) {
                    console.error('Delete Partner Error:', error);
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Expulsion Failed',
                        message: error.message
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleWalletAdjustment = async (partnerId, currentBalance, amount, reason = '') => {
        if (!isSuperAdmin) return;
        if (!amount || isNaN(amount) || amount === 0) return;

        try {
            setLoading(true);
            const { error } = await supabase.rpc('adjust_partner_wallet', {
                target_partner_id: partnerId,
                adjustment_amount: parseFloat(amount),
                adjustment_reason: reason,
                admin_id: currentUser.id
            });

            if (error) throw error;

            setModalConfig({ type: null, partner: null, data: {} });
            await fetchData();
        } catch (error) {
            console.error('Wallet Adjustment Error:', error);
            alert('Failed to adjust wallet: ' + error.message);
        } finally {
            setLoading(false);
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
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Profile Updated',
                message: 'Partner information has been synchronized.'
            });
        } catch (error) {
            console.error('Update Partner Error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Sync Failed',
                message: error.message
            });
        }
    };

    const handleExportPayouts = () => {
        if (payoutRequests.length === 0) return;

        const headers = ['Date', 'Partner Name', 'Email', 'Amount', 'Status', 'Method', 'Recipient Details', 'Processed At'];
        const csvContent = [
            headers.join(','),
            ...payoutRequests.map(r => [
                new Date(r.created_at).toLocaleDateString(),
                `"${r.partner?.full_name || 'N/A'}"`,
                r.partner?.email || 'N/A',
                r.amount,
                r.status,
                r.method,
                `"${r.recipient_details || ''}"`,
                r.processed_at ? new Date(r.processed_at).toLocaleString() : 'Pending'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `taxfriends_payouts_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleClearProcessedHistory = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Purge Payout History?',
            message: 'Are you sure you want to permanently delete ALL settled and rejected payout records? This keeps the database lean but clears the trace. Continue?',
            danger: true,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    const { error } = await supabase.rpc('clear_processed_payouts');
                    if (error) throw error;
                    await fetchData();
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        title: 'Cleanup Complete',
                        message: 'All processed payout records have been purged.'
                    });
                } catch (error) {
                    console.error('Cleanup Error:', error);
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Cleanup Failed',
                        message: error.message
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleClearEarningHistory = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Purge Earning History?',
            message: 'CRITICAL: This will wipe all royalty/earning logs from the system for all partners. Balances are NOT affected. Do you wish to continue?',
            danger: true,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    const { error } = await supabase.rpc('clear_all_earning_history');
                    if (error) throw error;
                    await fetchData();
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        title: 'Earnings Purged',
                        message: 'All partner earning history has been cleared successfully.'
                    });
                } catch (error) {
                    console.error('Cleanup Error:', error);
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Purge Failed',
                        message: error.message
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
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

    const pendingPayoutsList = payoutRequests.filter(p => p.status === 'pending');
    const payoutHistoryList = payoutRequests.filter(p => p.status === 'completed' || p.status === 'rejected');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Partner Management</h1>
                    <p className="text-slate-500 font-medium">Manage franchise partners, KYC verifications, and payouts.</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {activeTab === 'payouts' && (
                        <button
                            onClick={handleExportPayouts}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-2x border border-emerald-100/20 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
                        >
                            <Download size={14} /> Export Report
                        </button>
                    )}
                    {activeTab === 'history' && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearEarningHistory}
                                className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Activity size={14} /> Purge Earning History
                            </button>
                            <button
                                onClick={handleClearProcessedHistory}
                                className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} /> Purge Payout History
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Total Partners" value={stats.total} color="emerald" />
                <StatCard icon={CheckCircle2} label="Payouts Completed" value={`₹${stats.totalApprovedPayouts}`} color="emerald" />
                <StatCard icon={Wallet} label="Pending Payouts" value={stats.pendingPayouts} color="emerald" />
                <StatCard icon={Shield} label="Pending KYC" value={stats.pendingKyc} color="emerald" />
            </div>

            {/* Tabs & Search */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
                    <div className="flex bg-white p-1 rounded-2xl shadow-inner border border-slate-200/50 self-start">
                        <TabButton active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} label="Pending Payouts" count={stats.pendingPayouts} />
                        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Payout History" />
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
                        {activeTab === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="divide-y divide-slate-100"
                            >
                                {payoutHistoryList.length === 0 ? (
                                    <EmptyState icon={Clock} title="No History" desc="No completed payout records found." />
                                ) : (
                                    payoutHistoryList.map(item => (
                                        <PayoutHistoryRow key={item.id} request={item} />
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
                                        onDelete={handleDeletePartner}
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
                    <VerifyKycModal
                        partner={modalConfig.partner}
                        onClose={() => setModalConfig({ type: null, partner: null, data: {} })}
                        onConfirm={(status) => handleUpdateKyc(modalConfig.partner.id, status)}
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

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                danger={confirmModal.danger}
            />
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

const PartnerRow = ({ partner, type, onUpdate, isSuperAdmin, onWalletAdj, onContact, onVerify, onEdit, onDelete }) => {
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
                                                    <MenuButton
                                                        icon={Trash2}
                                                        label="Delete Partner"
                                                        onClick={() => { setShowMenu(false); onDelete(partner.id); }}
                                                        color="text-rose-600 font-black"
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
                        <button onClick={() => setType('credit')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'credit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Credit</button>
                        <button onClick={() => setType('debit')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'debit' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Debit</button>
                        <button onClick={() => setType('payout')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'payout' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Payout</button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                {type === 'payout' ? 'Manual Payout Amount' : 'Adjustment Amount'}
                            </label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-[60px] bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 font-black text-slate-700 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                                />
                            </div>
                        </div>

                        {(type === 'debit' || type === 'payout') && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {type === 'payout' ? 'Reference / Trnx ID*' : 'Reason for Adjustment*'}
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={type === 'payout' ? "Enter UPI Ref or NEFT ID..." : "Enter reason for this adjustment..."}
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onConfirm(type === 'credit' ? parseFloat(amount) : -parseFloat(amount), type === 'payout' ? `MANUAL_PAYOUT: ${reason}` : reason)}
                        disabled={!amount || ((type === 'debit' || type === 'payout') && !reason)}
                        className={`w-full h-[64px] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:grayscale ${type === 'credit' ? 'bg-emerald-600 text-white shadow-emerald-200' :
                            type === 'debit' ? 'bg-rose-600 text-white shadow-rose-200' :
                                'bg-blue-600 text-white shadow-blue-200'
                            }`}
                    >
                        <Save size={18} /> {type === 'credit' ? 'Execute Credit' : type === 'debit' ? 'Execute Debit' : 'Record Payout'}
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

const PayoutHistoryRow = ({ request }) => (
    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
        <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${request.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {request.status === 'completed' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            </div>
            <div>
                <div className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    ₹{request.amount} {request.status === 'completed' ? 'Settled' : 'Rejected'}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Users size={10} /> {request.partner?.full_name}</span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Clock size={10} /> {new Date(request.processed_at || request.created_at).toLocaleDateString()}</span>
                    </div>
                    {request.admin_notes && (
                        <p className="text-[9px] font-bold text-slate-500 italic mt-1 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                            Note: {request.admin_notes}
                        </p>
                    )}
                </div>
            </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${request.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {request.status}
        </div>
    </div>
);

const VerifyKycModal = ({ partner, onClose, onConfirm }) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const { data } = await supabase
                .from('user_documents')
                .select('*')
                .eq('user_id', partner.id);
            setDocs(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative z-10 border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">KYC Verification</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Reviewing {partner.full_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                        <AlertCircle className="text-amber-600 shrink-0" size={20} />
                        <p className="text-xs font-bold text-amber-800 leading-relaxed uppercase tracking-wide">
                            Manual verification bypasses automated document checks. Ensure identity is confirmed offline before proceeding.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Submitted Documents</h4>
                        {loading ? (
                            <div className="h-20 flex items-center justify-center text-slate-300"><Loader2 className="animate-spin" /></div>
                        ) : docs.length === 0 ? (
                            <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No documents uploaded yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {docs.map(doc => (
                                    <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm"><FileText className="text-indigo-600" size={18} /></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{doc.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{doc.doc_type || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-3 shrink-0">
                    <button onClick={() => onConfirm('rejected')} className="py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Reject KYC</button>
                    <button onClick={() => onConfirm('verified')} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200">Force Verify</button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminPartners;
