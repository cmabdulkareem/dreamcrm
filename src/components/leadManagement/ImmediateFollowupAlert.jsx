import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import API from "../../config/api";
import { toast } from "react-toastify";
import { Bell, Clock, X, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ImmediateFollowupAlert() {
    const { user, selectedBrand } = useContext(AuthContext);
    const { socket } = useNotifications();
    const [followups, setFollowups] = useState([]);
    const [dismissedIds, setDismissedIds] = useState(new Set());
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    const brandId = selectedBrand?._id || selectedBrand?.id;

    // Update current time every second for a live countdown feel
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchFollowups = useCallback(async () => {
        if (!user || !brandId) return;
        try {
            const response = await axios.get(`${API}/customers/get-immediate-followups`, {
                withCredentials: true,
                headers: { "x-brand-id": brandId },
            });
            setFollowups(response.data.customers || []);
        } catch (error) {
            console.error("Error fetching immediate followups:", error);
        }
    }, [user, brandId]);

    useEffect(() => {
        fetchFollowups();

        if (socket) {
            const handleImmediateFollowup = (data) => {
                const { customer, brandId: eventBrandId } = data;
                if (!customer) return;

                // Only update if it belongs to the current brand
                if (brandId && eventBrandId && String(brandId) !== String(eventBrandId)) {
                    return;
                }

                console.log('🔔 Processing immediate:followup for lead:', customer.fullName, 'Cleared:', !customer.immediateFollowupAt);

                // Aggressive refresh: just fetch from server to be 100% sure
                fetchFollowups();

                // Also update local state for faster perceived performance
                setFollowups(prev => {
                    if (!customer.immediateFollowupAt) {
                        return prev.filter(f => f._id !== customer._id);
                    }
                    const exists = prev.some(f => f._id === customer._id);
                    if (exists) {
                        return prev.map(f => f._id === customer._id ? customer : f);
                    }
                    return [customer, ...prev];
                });
            };

            socket.on('immediate:followup', handleImmediateFollowup);
            return () => {
                socket.off('immediate:followup', handleImmediateFollowup);
            };
        }
    }, [fetchFollowups, socket, brandId]);

    // Cleanup dismissed IDs periodically or refresh every 5 mins
    useEffect(() => {
        const interval = setInterval(fetchFollowups, 300000); // 5 mins fallback

        const handleRefresh = () => {
            console.log("🔄 Refreshing immediate followups via custom event");
            fetchFollowups();
        };
        window.addEventListener("refresh-immediate-followups", handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener("refresh-immediate-followups", handleRefresh);
        };
    }, [fetchFollowups]);

    // Filter by:
    // 1. Not dismissed
    // 2. Within 15 minutes of due time (or already past due)
    const activeFollowups = followups.filter(f => {
        if (dismissedIds.has(f._id)) return false;
        if (!f.immediateFollowupAt) return false;

        const targetTime = new Date(f.immediateFollowupAt);
        const windowStart = new Date(currentTime.getTime() + 15 * 60000); // 15 mins from now

        // Show if target is in the past (due) OR within 15 mins from now
        return targetTime <= windowStart;
    });

    if (activeFollowups.length === 0) return null;

    const handleDismiss = (id) => {
        setDismissedIds(prev => new Set([...prev, id]));
    };

    const getAlertMetadata = (deadline) => {
        const target = new Date(deadline);
        const diff = target - currentTime;
        const isPastDue = diff <= 0;

        let timeLeftString = "Due Now";
        let pulseDuration = "1s"; // Default fast pulse for overdue

        if (!isPastDue) {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);

            if (mins > 60) {
                const hours = Math.floor(mins / 60);
                const remainingMins = mins % 60;
                timeLeftString = `${hours}h ${remainingMins}m`;
                pulseDuration = "4s"; // Very slow
            } else {
                timeLeftString = `${mins}m ${secs.toString().padStart(2, '0')}s`;
                // Scale pulse duration from 3s (at 15m) down to 0.5s (at 0m)
                const urgency = Math.max(0, Math.min(1, diff / (15 * 60 * 1000)));
                pulseDuration = `${(0.5 + urgency * 2.5).toFixed(2)}s`;
            }
        }

        return { timeLeftString, isPastDue, pulseDuration };
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-3 max-w-sm w-full px-4">
            <style>
                {`
                @keyframes breathe {
                    0%, 100% { transform: scale(1); box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
                    50% { transform: scale(1.03); box-shadow: 0 25px 60px rgba(0,0,0,0.25); }
                }
                .animate-breath {
                    animation: breathe var(--breath-speed) ease-in-out infinite;
                }
                `}
            </style>
            {activeFollowups.map((lead) => {
                const { timeLeftString, isPastDue, pulseDuration } = getAlertMetadata(lead.immediateFollowupAt);

                return (
                    <div
                        key={lead._id}
                        style={{ '--breath-speed': pulseDuration }}
                        className={`relative p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-l-4 backdrop-blur-md bg-opacity-95 transform transition-all animate-breath duration-500 ${isPastDue
                            ? "bg-red-50/95 dark:bg-red-900/40 border-red-500 text-red-900 dark:text-red-100 shadow-red-500/20"
                            : "bg-white/95 dark:bg-gray-800/95 border-yellow-500 text-gray-900 dark:text-white shadow-yellow-500/20"
                            }`}
                    >
                        <button
                            onClick={() => handleDismiss(lead._id)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${isPastDue ? "bg-red-100" : "bg-yellow-100"}`}>
                                <Clock className={`w-5 h-5 ${isPastDue ? "text-red-600" : "text-yellow-600"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">
                                    Immediate Followup
                                </p>
                                <h4 className="font-bold truncate text-sm mb-1 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 opacity-50" /> {lead.fullName}
                                </h4>
                                <div className="flex items-center gap-2 text-xs opacity-80 mb-3">
                                    <Phone className="w-3 h-3" /> {lead.phone1}
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded shadow-sm ${isPastDue ? "bg-red-600 text-white animate-pulse" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50"
                                        }`}>
                                        {timeLeftString}
                                    </span>
                                    <button
                                        onClick={() => {
                                            sessionStorage.setItem("openLeadId", lead._id);
                                            navigate(`/lead-management?t=${Date.now()}`);
                                        }}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline underline-offset-4"
                                    >
                                        Action Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
