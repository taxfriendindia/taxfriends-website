import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Download, AlertTriangle, Hammer } from 'lucide-react';

// This version should match your physical version in package.json
const CURRENT_APP_VERSION = '1.0.0';

const ForceUpdate = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOutdated, setIsOutdated] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('app_config')
                    .select('*')
                    .limit(1)
                    .single();

                if (fetchError) throw fetchError;

                setConfig(data);

                // Compare versions (Simple semantic versioning check)
                if (compareVersions(CURRENT_APP_VERSION, data.min_version) < 0) {
                    setIsOutdated(true);
                }
            } catch (err) {
                console.error('Error checking app version:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkVersion();
    }, []);

    // Helper function to compare versions (e.g., "1.0.1" vs "1.1.0")
    const compareVersions = (current, min) => {
        const v1 = current.split('.').map(Number);
        const v2 = min.split('.').map(Number);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const n1 = v1[i] || 0;
            const n2 = v2[i] || 0;
            if (n1 > n2) return 1;
            if (n1 < n2) return -1;
        }
        return 0;
    };

    const handleUpdate = () => {
        if (config?.download_url) {
            window.open(config.download_url, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a1a2e]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Initializing TaxFriend India...</p>
                </div>
            </div>
        );
    }

    // Maintenance Mode Check
    if (config?.is_maintenance_mode) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a1a2e] p-6">
                <div className="max-w-md w-full bg-[#242445] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Hammer className="w-10 h-10 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Under Maintenance</h2>
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        {config.maintenance_message}
                    </p>
                    <div className="text-sm text-gray-500 font-mono">
                        V{CURRENT_APP_VERSION}
                    </div>
                </div>
            </div>
        );
    }

    // Mandatory Update Required
    if (isOutdated) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a1a2e] p-6">
                <div className="max-w-md w-full bg-[#242445] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Update Required</h2>
                    <p className="text-blue-400 text-sm font-semibold mb-4 uppercase tracking-wider">New Version Available</p>
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        {config.update_message}
                    </p>
                    <button
                        onClick={handleUpdate}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                    >
                        <Download className="w-5 h-5" />
                        Update Now
                    </button>
                    <p className="text-xs text-gray-500 mt-6">
                        Current Version: {CURRENT_APP_VERSION} | Required: {config.min_version}
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default ForceUpdate;
