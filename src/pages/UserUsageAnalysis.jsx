import { useState, useEffect } from 'react';
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

    const getStatusColor = (days) => {
        if (days === null) return "text-gray-400";
        if (days === 0) return "text-green-500";
        if (days < 3) return "text-blue-500";
        if (days < 7) return "text-yellow-500";
        return "text-red-500";
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
                            <div className="flex flex-col items-center p-2">
                                <div className="relative mb-4">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.fullName}
                                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                            <UserCircleIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${user.accountStatus === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 text-center mb-1">
                                    {user.fullName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate w-full text-center">
                                    {user.email}
                                </p>

                                <div className="flex flex-wrap justify-center gap-1 mb-4">
                                    {user.roles.map((role) => (
                                        <span key={role} className="px-2 py-0.5 text-[10px] font-medium bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 rounded-full">
                                            {role}
                                        </span>
                                    ))}
                                </div>

                                <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">Activity:</span>
                                        <span className={`font-bold ${getStatusColor(user.daysInactive)}`}>
                                            {user.daysInactive === null ? "Inactive" : user.daysInactive === 0 ? "Online Today" : `${user.daysInactive} days missed`}
                                        </span>
                                    </div>
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
