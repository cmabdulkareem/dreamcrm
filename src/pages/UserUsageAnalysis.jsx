import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import API from '../config/api';
import ComponentCard from '../components/common/ComponentCard';
import PageBreadCrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import { UserCircleIcon } from '../icons';

const UserUsageAnalysis = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API}/users/usage-stats`, { withCredentials: true });
            setUsers(response.data.users);
        } catch (error) {
            console.error("Error fetching usage stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Socket setup for real-time presence
        const socketUrl = API.replace('/api', '');
        const socket = io(socketUrl, { withCredentials: true });

        socket.on('user:online', (data) => {
            setUsers(prev => prev.map(u =>
                String(u.id) === String(data.userId) ? { ...u, isOnline: true } : u
            ));
        });

        socket.on('user:offline', (data) => {
            setUsers(prev => prev.map(u =>
                String(u.id) === String(data.userId) ? { ...u, isOnline: false } : u
            ));
        });

        return () => socket.disconnect();
    }, []);

    const formatLastLogin = (date) => {
        if (!date) return "Never logged in";
        return new Date(date).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active': return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
            case 'Inactive': return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
            case 'Dormant': return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    const getScoreColor = (score) => {
        if (score >= 70) return "text-green-500";
        if (score >= 40) return "text-blue-500";
        if (score >= 15) return "text-yellow-500";
        return "text-red-500";
    };

    const getRiskBadge = (risk) => {
        switch (risk) {
            case 'High': return "bg-red-100 text-red-700 ring-1 ring-red-400/30";
            case 'Medium': return "bg-orange-100 text-orange-700 ring-1 ring-orange-400/30";
            default: return "bg-gray-100 text-gray-700 ring-1 ring-gray-400/30";
        }
    };

    return (
        <>
            <PageMeta title="User Usage Analysis | Student Management" />
            <PageBreadCrumb pageTitle="User Usage Analysis" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading ? (
                    <div className="col-span-full text-center py-20">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500">
                        No user activity data found.
                    </div>
                ) : (
                    users.map((user) => (
                        <ComponentCard key={user.id}>
                            <div className="flex flex-col p-1">
                                {/* Header Area */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="relative">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.fullName}
                                                className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 dark:border-gray-800"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                <UserCircleIcon className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${user.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`} />
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(user.usageStatus)}`}>
                                            {user.usageStatus}
                                        </span>
                                        {user.isOnline && (
                                            <span className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-[9px] font-bold text-green-600 animate-pulse border border-green-200 uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Live Now
                                            </span>
                                        )}
                                        {user.churnRisk !== 'Low' && (
                                            <span className={`mt-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getRiskBadge(user.churnRisk)}`}>
                                                Risk: {user.churnRisk}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                                        {user.fullName}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Roles */}
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {user.roles.map((role) => (
                                        <span key={role} className="px-2 py-0.5 text-[9px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-md">
                                            {role}
                                        </span>
                                    ))}
                                </div>

                                {/* Metrics Dashboard */}
                                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold tracking-tighter">Engagement</p>
                                        <p className={`text-xl font-black ${getScoreColor(user.engagementScore)}`}>
                                            {user.engagementScore}<span className="text-[10px]">%</span>
                                        </p>
                                    </div>
                                    <div className="text-center border-l border-gray-200 dark:border-gray-800">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold tracking-tighter">30d Actions</p>
                                        <p className="text-xl font-black text-gray-800 dark:text-gray-100">
                                            {user.totalActions30d}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer Details */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB') : 'Never'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-500 dark:text-gray-400">Last Action:</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            {user.daysSinceLastActivity === null ? "No activity" : user.daysSinceLastActivity === 0 ? "Today" : `${user.daysSinceLastActivity}d ago`}
                                        </span>
                                    </div>
                                    {user.modulesUsed && user.modulesUsed.length > 0 && (
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Module Adoption</p>
                                            <div className="flex gap-2 text-gray-600 dark:text-gray-400">
                                                {user.modulesUsed.map(mod => (
                                                    <span key={mod} title={mod} className="text-[10px] px-1.5 py-0.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded">
                                                        {mod.charAt(0)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ComponentCard>
                    ))
                )}
            </div>
        </>
    );
};

export default UserUsageAnalysis;
