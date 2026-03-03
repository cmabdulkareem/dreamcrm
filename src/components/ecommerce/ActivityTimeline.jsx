import React, { useState, useEffect } from "react";
import axios from "axios";
import API from "../../config/api";
import LoadingSpinner from "../common/LoadingSpinner";
import { Clock, History, UserCircle, Calendar, Plus, CheckCircle2 } from "lucide-react";

const ActivityTimeline = ({ className = "" }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await axios.get(`${API}/customers/activity-logs`, { withCredentials: true });
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error("Error fetching activity logs:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <LoadingSpinner size="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 h-full overflow-hidden shadow-sm ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20 shadow-sm">
                        <History className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Lead Activities</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Across the brand</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <div className="space-y-3 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-brand-500/50 before:via-gray-100 dark:before:via-gray-800 before:to-transparent">
                    {logs.length === 0 ? (
                        <div className="text-center py-12 opacity-20">
                            <Clock className="size-10 mx-auto mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest">No activity logged</p>
                        </div>
                    ) : (
                        logs.map((log, idx) => {
                            const isLatest = idx === 0;
                            const date = new Date(log.createdAt);

                            return (
                                <div key={log._id} className={`relative pl-12 transition-all duration-500 ${isLatest ? 'opacity-100' : 'opacity-80'}`}>
                                    {/* Icon Circle */}
                                    <div className={`absolute left-0 top-1 size-9 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center z-10 shadow-sm transition-all ${isLatest ? 'bg-brand-500 scale-105' : 'bg-gray-100 dark:bg-gray-800'
                                        }`}>
                                        {log.action === 'CREATE' ? (
                                            <Plus className={`size-3.5 ${isLatest ? 'text-white font-bold' : 'text-gray-400'}`} />
                                        ) : (
                                            <CheckCircle2 className={`size-3.5 ${isLatest ? 'text-white font-bold' : 'text-gray-400'}`} />
                                        )}
                                    </div>

                                    {/* Log Card */}
                                    <div className={`bg-gray-50/50 dark:bg-white/[0.02] border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 group ${isLatest ? 'border-brand-500/20' : 'border-gray-50 dark:border-gray-800'
                                        }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10' :
                                                log.action === 'DELETE' ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10' :
                                                    'bg-brand-50 text-brand-500 border border-brand-100 dark:bg-brand-500/10'
                                                }`}>
                                                {log.action}
                                            </span>
                                            <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold">
                                                <Calendar className="size-3" />
                                                {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                <span className="opacity-30">•</span>
                                                {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <p className="text-[12px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed mb-3">
                                            {log.description}
                                        </p>

                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-[9px] font-black text-slate-500 border border-slate-200 dark:border-gray-600 overflow-hidden">
                                                {log.userId?.avatar ? (
                                                    <img src={log.userId.avatar} alt={log.userId.fullName} className="size-full object-cover" />
                                                ) : (
                                                    log.userId?.fullName?.charAt(0) || 'S'
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                                {log.userId?.fullName || 'System'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityTimeline;
