import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, ArrowUpRight, Clock, CheckCircle2, AlertCircle,
    Info, ChevronRight, QrCode, TrendingUp, IndianRupee,
    ArrowDownLeft, Sparkles, Filter, Download, ExternalLink,
    Zap, ShieldCheck, Loader2, Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StatusModal from '../../components/StatusModal';

const WalletHistory = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [royalties, setRoyalties] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [completedServicesCount, setCompletedServicesCount] = useState(0);
    const [activeTab, setActiveTab] = useState('earnings');
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        if (user) fetchWalletData();
    }, [user]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);

            // 1. Get Wallet Balance & Profile
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(prof);
            setBalance(prof?.wallet_balance || 0);

            // 2. Get Royalties
            const { data: roys } = await supabase
                .from('partner_royalties')
                .select('*, client:client_id(full_name)')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });
            setRoyalties(roys || []);

            // 3. Get Payout History
            const { data: payHistory } = await supabase
                .from('payout_requests')
                .select('*')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });
            setPayouts(payHistory || []);

            // 4. Fetch Completed Services for eligibility
            const { count } = await supabase
                .from('user_services')
                .select('*', { count: 'exact', head: true })
                .or(`partner_id.eq.${user.id}`)
                .eq('status', 'completed');

            setCompletedServicesCount(count || 0);

        } catch (error) {
            console.error('Wallet error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayout = async (requestedAmount) => {
        if (!profile?.payout_upi) {
            setStatusModal({
                isOpen: true,
                type: 'warning',
                title: 'UPI Missing',
                message: 'Please update your UPI ID in Profile settings first.'
            });
            return;
        }

        setRequesting(true);
        try {
            const { error } = await supabase
                .from('payout_requests')
                .insert([{
                    partner_id: user.id,
                    amount: requestedAmount,
                    recipient_details: profile.payout_upi,
                    status: 'pending'
                }]);

            if (error) throw error;
            setShowPayoutModal(false);
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Request Sent',
                message: `Payout request for ₹${requestedAmount} submitted! Our team will verify your records shortly.`
            });
            fetchWalletData();
        } catch (error) {
            console.error('Payout request error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Request Failed',
                message: 'Failed to submit payout request. Please try again later.'
            });
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Wallet Data</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Wallet & Earnings
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] uppercase tracking-[0.2em] border border-indigo-100">Live</div>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Manage your franchise royalties and settlements</p>
                </div>
                <div className="flex gap-3">
                    <a href="/partner/profile" className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm">
                        Profile Settings
                    </a>
                </div>
            </header>

            {/* Wallet Overview & Eligibility */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Card */}
                <div className="lg:col-span-8 bg-slate-950 rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-600/30 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -ml-32 -mb-32" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-12">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Available Funds</span>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter flex items-center gap-4">
                                    ₹{balance.toLocaleString()}
                                    <span className="text-xl md:text-2xl font-black text-slate-700 uppercase">INR</span>
                                </h2>
                            </div>
                            <div className="p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg">
                                <Wallet size={32} className="text-indigo-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Lifetime Earnings</span>
                                        <span className="text-lg font-black text-emerald-400">₹{(royalties.filter(r => r.amount > 0).reduce((acc, r) => acc + (r.amount || 0), 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Withdrawn</span>
                                        <span className="text-lg font-black text-indigo-400">₹{(payouts.filter(p => p.status === 'completed').reduce((acc, p) => acc + (p.amount || 0), 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                                    <Zap size={16} className="text-amber-400" />
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                                        Fast payouts processed every <span className="text-white">Friday</span> for verified records.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPayoutModal(true)}
                                disabled={balance < 300}
                                className="w-full md:w-auto px-10 py-5 bg-white text-slate-900 rounded-[28px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all active:scale-95 shadow-2xl shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                            >
                                <Sparkles size={20} className="group-hover/btn:rotate-12 transition-transform text-indigo-600" />
                                Request Payout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Eligibility Tracker */}
                <div className="lg:col-span-4 bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={20} className="text-indigo-600" />
                        <h3 className="font-black text-slate-900 uppercase tracking-tight">Eligibility Checklist</h3>
                    </div>

                    <div className="space-y-4">
                        <EligibilityRow label="Min. Balance ₹300" current={balance} target={300} type="currency" />

                        <EligibilityRow label="KYC Verified" status={profile?.kyc_status} type="status" />
                    </div>

                    <div className="mt-auto p-5 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                        <div className="flex items-center gap-2 text-amber-700">
                            <Info size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Verification Required</span>
                        </div>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider leading-relaxed">
                            Email service screenshots to <span className="text-amber-800 underline">taxfriend.tax@gmail.com</span> for verification. Payouts are approved within 24 hours of document check.
                        </p>
                    </div>
                </div>
            </div>

            {/* Records Section */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setActiveTab('earnings')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'earnings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Earnings
                        </button>
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payouts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Payout History
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-500">
                            <Filter size={14} /> All Time
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'earnings' ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="earnings" className="divide-y divide-slate-50">
                                {royalties.length === 0 ? (
                                    <EmptyState label="No earnings recorded yet" />
                                ) : (
                                    royalties.map(roy => {
                                        const isAdj = roy.type === 'adjustment';
                                        return (
                                            <TransactionRow
                                                key={roy.id}
                                                title={isAdj ? (roy.amount > 0 ? 'Balance Credit' : 'Balance Debit') : `Royalty: ${roy.client?.full_name || 'Service'}`}
                                                subtitle={isAdj ? 'Administrative Adjustment' : `${roy.type === 'direct' ? 'Direct Submission' : 'Referral Commission'} • ${new Date(roy.created_at).toLocaleDateString()}`}
                                                amount={roy.amount}
                                                status={roy.status}
                                                type={roy.amount > 0 ? 'credit' : 'debit'}
                                            />
                                        );
                                    })
                                )}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="payouts" className="divide-y divide-slate-50">
                                {payouts.length === 0 ? (
                                    <EmptyState label="No payout requests found" />
                                ) : (
                                    payouts.map(pay => (
                                        <TransactionRow
                                            key={pay.id}
                                            title="Payout Withdrawal"
                                            subtitle={`Requested on ${new Date(pay.created_at).toLocaleDateString()} • Via ${pay.recipient_details || 'UPI'}`}
                                            amount={pay.amount}
                                            status={pay.status}
                                            type="debit"
                                            notice={pay.status === 'pending' || pay.status === 'processing' ? 'Verification in progress' : null}
                                        />
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {/* Payout Request Modal */}
            <AnimatePresence>
                {showPayoutModal && (
                    <PayoutAmountModal
                        balance={balance}
                        onClose={() => setShowPayoutModal(false)}
                        onConfirm={handleRequestPayout}
                        loading={requesting}
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
        </div>
    );
};

const EligibilityRow = ({ label, current, target, type, status }) => {
    let complete = false;
    if (type === 'currency' || type === 'count') complete = current >= target;
    if (type === 'status') complete = status === 'verified';

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100/50 rounded-2xl group hover:border-indigo-100 transition-all">
            <div className="space-y-1">
                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{label}</p>
                {type !== 'status' && (
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full bg-${complete ? 'emerald' : 'indigo'}-500 transition-all`} style={{ width: `${Math.min((current / target) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                            {type === 'currency' ? `₹${current}` : current} / {type === 'currency' ? `₹${target}` : target}
                        </span>
                    </div>
                )}
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${complete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                {complete ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            </div>
        </div>
    );
};

const TransactionRow = ({ title, subtitle, amount, status, type, notice }) => (
    <div className="p-8 flex items-center justify-between hover:bg-slate-50/5 transition-colors group">
        <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                {type === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div>
                <h4 className="font-black text-slate-800 tracking-tight">{title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
                {notice && (
                    <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md w-fit">
                        <Clock size={10} className="text-amber-500 animate-pulse" />
                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">{notice}</span>
                    </div>
                )}
            </div>
        </div>
        <div className="text-right space-y-1">
            <div className={`text-xl font-black ${type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>{type === 'credit' ? '+' : '-'}₹{amount.toLocaleString()}</div>
            <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status === 'completed' || status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                status === 'pending' || status === 'processing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                {status}
            </div>
        </div>
    </div>
);

const EmptyState = ({ label }) => (
    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100">
            <Clock size={32} />
        </div>
        <p className="text-slate-400 font-bold italic">{label}</p>
    </div>
);

export default WalletHistory;

const PayoutAmountModal = ({ balance, onClose, onConfirm, loading }) => {
    const [amount, setAmount] = useState(balance);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val < 300) {
            setError('Minimum withdrawal is ₹300');
            return;
        }
        if (val > balance) {
            setError('Cannot exceed available balance');
            return;
        }
        onConfirm(val);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-md p-8 md:p-10 shadow-2xl relative z-10 border border-slate-100 overflow-hidden"
            >
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="relative">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Withdraw Funds</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select payout amount</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <Filter size={20} className="rotate-45" />
                        </button>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-3xl mb-8 flex justify-between items-center">
                        <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Available</span>
                            <p className="text-2xl font-black">₹{balance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <Wallet size={24} className="text-indigo-400" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payout Amount</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setError('');
                                    }}
                                    className={`w-full h-16 bg-slate-50 border ${error ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} rounded-2xl pl-14 pr-6 font-black text-slate-700 text-lg outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all`}
                                    placeholder="0.00"
                                />
                            </div>
                            {error && <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 ml-1"> <AlertCircle size={12} /> {error}</p>}
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                            <Zap size={16} className="text-indigo-600 shrink-0" />
                            <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-wide">
                                Funds will be transferred to your registered UPI ID <span className="font-black underline underline-offset-2">every Friday</span>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                            {loading ? 'Processing...' : 'Confirm Withdrawal'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
