import React from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { UserCircleIcon, CalendarIcon, ListIcon, PlusIcon } from '../../icons';
import { Link } from 'react-router-dom';

const HRDashboard = () => {
    // Placeholder data - replace with API calls later
    const stats = [
        { title: 'Total Employees', value: '124', icon: <UserCircleIcon className="w-6 h-6 text-brand-500" />, change: '+4 this month' },
        { title: 'On Leave Today', value: '8', icon: <CalendarIcon className="w-6 h-6 text-yellow-500" />, change: '2 pending approval' },
        { title: 'Open Positions', value: '5', icon: <ListIcon className="w-6 h-6 text-green-500" />, change: '12 new applications' },
        { title: 'Interviews Today', value: '3', icon: <UserCircleIcon className="w-6 h-6 text-purple-500" />, change: 'Next at 2:00 PM' },
    ];

    const recentActivity = [
        { id: 1, user: 'Sarah Wilson', action: 'Applied for leave', time: '2 hours ago', type: 'leave' },
        { id: 2, user: 'John Doe', action: 'Completed onboarding', time: '4 hours ago', type: 'onboarding' },
        { id: 3, user: 'Recruitment Team', action: 'Posted new job: Senior React Dev', time: '1 day ago', type: 'job' },
    ];

    return (
        <>
            <PageMeta title="HR Dashboard - CRM" />
            <PageBreadCrumb items={[{ name: 'HR', path: '/hr' }, { name: 'Dashboard' }]} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</h3>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                {stat.icon}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="text-green-500 font-medium">↑</span> {stat.change}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ComponentCard title="Recent Activity">
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                    <div className={`w-2 h-2 mt-2 rounded-full ${activity.type === 'leave' ? 'bg-yellow-500' :
                                            activity.type === 'onboarding' ? 'bg-green-500' :
                                                'bg-brand-500'
                                        }`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.user}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.action}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    </ComponentCard>
                </div>

                <div>
                    <ComponentCard title="Quick Actions">
                        <div className="space-y-3">
                            <Link to="/hr/employees/new" className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <PlusIcon className="w-5 h-5 text-brand-500" />
                                Add New Employee
                            </Link>
                            <Link to="/hr/recruitment/jobs/new" className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <PlusIcon className="w-5 h-5 text-green-500" />
                                Post New Job
                            </Link>
                            <Link to="/leave-management/requests" className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <CalendarIcon className="w-5 h-5 text-yellow-500" />
                                Review Leave Requests
                            </Link>
                        </div>
                    </ComponentCard>
                </div>
            </div>
        </>
    );
};

export default HRDashboard;
