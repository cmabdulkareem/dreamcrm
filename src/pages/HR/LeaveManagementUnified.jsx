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

        if (hasRole(user, 'HR', brandId) || hasRole(user, 'Owner', brandId)) return 'approvals';
        return 'apply';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    const canManageLeaves = hasRole(user, 'HR', brandId) || hasRole(user, 'Owner', brandId);

    const tabs = [
        ...(canManageLeaves ? [{ id: 'approvals', label: 'Leave Approvals' }] : []),
        { id: 'my-leaves', label: 'My History' },
        { id: 'apply', label: 'Apply for Leave' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'apply': return <ApplyLeave />;
            case 'my-leaves': return <MyLeaves />;
            case 'approvals': return <ManageLeaves />;
            default: return <ApplyLeave />;
        }
    };

    return (
        <div className="space-y-6">
            <PageMeta title="Leave Management - CDC Insights" />
            <PageBreadCrumb
                items={[
                    { name: 'Dashboard', path: '/' },
                    { name: 'Leave Management' },
                ]}
            />

            <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                            Leave Management
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                            Efficiently track, apply, and approve employee leave requests.
                        </p>
                    </div>
                </div>

                {/* Tab Navigation - Premium Pill Style */}
                <div className="flex flex-wrap gap-1 p-1.5 bg-gray-100/80 dark:bg-white/[0.03] border border-gray-200/50 dark:border-gray-800 rounded-2xl w-fit shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-blue-950 text-white shadow-lg shadow-blue-950/20 active:scale-95'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area with smooth transition */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    {renderTabContent()}
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default LeaveManagementUnified;
