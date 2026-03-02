import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../context/AuthContext';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import { hasRole, isManager } from '../../utils/roleHelpers';

// Sub-components
import ApplyLeave from '../LeaveManagement/ApplyLeave';
import MyLeaves from '../LeaveManagement/MyLeaves';
import ManageLeaves from '../LeaveManagement/index'; // The existing index handles approvals

const LeaveManagementUnified = () => {
    const { user, selectedBrand } = useContext(AuthContext);
    const brandId = selectedBrand?._id || selectedBrand?.id;
    const location = useLocation();
    const navigate = useNavigate();

    // Determine initial tab based on URL or role
    const getInitialTab = () => {
        const path = location.pathname;
        if (path.includes('approvals')) return 'approvals';
        if (path.includes('apply')) return 'apply';
        if (path.includes('my-leaves')) return 'my-leaves';

        // Default based on role
        if (hasRole(user, 'HR', brandId) || hasRole(user, 'Owner', brandId)) return 'approvals';
        return 'apply';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Role-based visibility for "Approvals" tab
    const canManageLeaves = hasRole(user, 'HR', brandId) || hasRole(user, 'Owner', brandId);

    const tabs = [
        { id: 'apply', label: 'Apply Leave', icon: null },
        { id: 'my-leaves', label: 'My Leaves', icon: null },
        ...(canManageLeaves ? [{ id: 'approvals', label: 'Leave Approvals', icon: null }] : []),
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'apply':
                return <ApplyLeave />;
            case 'my-leaves':
                return <MyLeaves />;
            case 'approvals':
                return <ManageLeaves />;
            default:
                return <ApplyLeave />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            <PageMeta title="Leave Management - CDC Insights" />
            <PageBreadCrumb
                items={[
                    { name: 'Dashboard', path: '/' },
                    { name: 'EMS', path: '/hr' },
                    { name: 'Leave Management' },
                ]}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        Leave Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Track, apply, and manage employee leave requests in one place.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-theme-xs border border-gray-100 dark:border-gray-700 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-blue-950 text-white shadow-xl shadow-blue-900/20 scale-105'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {renderTabContent()}
                </div>
            </div>

            <ToastContainer position="top-right" />
        </div>
    );
};

export default LeaveManagementUnified;
