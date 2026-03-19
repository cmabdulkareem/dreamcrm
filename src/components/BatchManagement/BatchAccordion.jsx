import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import BatchStudentList from './BatchStudentList';
import AttendanceModal from './AttendanceModal';
import MonthlyAttendanceModal from './MonthlyAttendanceModal';
import CreateBatchModal from './CreateBatchModal';
import { useAuth } from '../../context/AuthContext';
import { hasRole, isAdmin, isOwner, isManager, isAcademicCoordinator } from '../../utils/roleHelpers.js';
import { GroupIcon } from '../../icons';

export default function BatchAccordion({ batch, onUpdate, onDelete }) {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

    // Permission check
    const isInstructor = (user && batch && user.fullName === batch.instructorName) || hasRole(user, 'Instructor');
    const canMarkAttendance = (isAdmin(user) || isOwner(user) || isManager(user) || isInstructor) && !isAcademicCoordinator(user);
    const canEdit = isAdmin(user) || isOwner(user) || isManager(user) || isAcademicCoordinator(user);

    const handleToggle = () => setIsExpanded(!isExpanded);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this batch and all its students?")) {
            try {
                await axios.delete(`${API}/batches/${batch._id}`, { withCredentials: true });
                toast.success("Batch deleted successfully.");
                onDelete(batch._id);
            } catch (error) {
                toast.error("Failed to delete batch.");
            }
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsEditModalOpen(true);
    };

    const handleBatchUpdated = (updatedBatch) => {
        onUpdate(updatedBatch);
        setIsEditModalOpen(false);
    };

    const calculateProgress = (start, end) => {
        const today = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (today < startDate) return 0;
        if (today > endDate) return 100;
        const total = endDate - startDate;
        const elapsed = today - startDate;
        return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    };

    const progress = calculateProgress(batch.startDate, batch.expectedEndDate);

    return (
        <div className={`relative border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] group ${isExpanded ? 'ring-2 ring-blue-800/20 dark:ring-blue-400/20 mb-6' : 'mb-4'}`}>
            {/* Top Indicator Line */}
            <div className={`absolute top-0 left-10 right-10 h-[3px] transition-all duration-500 ${batch.mode === 'online' ? 'bg-gradient-to-r from-blue-400 to-blue-800 opacity-60' : 'bg-gradient-to-r from-emerald-400 to-teal-500 opacity-60'}`} />

            <div className="p-6 md:p-8">
                {/* Header Row */}
                <div 
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer"
                    onClick={handleToggle}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-3">
                            <div className={`p-3 ${batch.mode === 'online' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}>
                                <GroupIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-950 transition-colors">
                                    {batch.isSlot ? `Vacant Slot ${batch.slot + 1}` : (batch.batchName || "Unnamed Batch")}
                                </h3>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600" />
                                    {batch.instructorName} • {batch.isSlot ? "Permanent Capacity Slot" : (batch.subject || 'Unassigned Curriculum')}
                                </p>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">                                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-3 border border-gray-100/50 dark:border-gray-700/30">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Duration</p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {batch.startDate ? (
                                        `${new Date(batch.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(batch.expectedEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    ) : (
                                        "Infinite Horizon"
                                    )}
                                </p>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-gray-900/30 p-3 border border-gray-100/50 dark:border-gray-700/30">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Timing</p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {batch.batchTime?.from || "TBD"} - {batch.batchTime?.to || "TBD"}
                                </p>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-gray-900/30 p-3 border border-gray-100/50 dark:border-gray-700/30">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Mode</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 ${batch.mode === 'online' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                                        {batch.mode || "flexible"}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-gray-900/30 p-3 border border-gray-100/50 dark:border-gray-700/30">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Enrollment/Progress</p>
                                <div className="flex items-center gap-3">
                                    {batch.isSlot ? (
                                        <span className="text-xs font-bold text-gray-400 italic">No Students Assigned</span>
                                    ) : (
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-800 transition-all duration-1000 ease-out"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{batch.studentCount || 0} Students Enrolled</span>
                                                </div>
                                            </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 mt-4 lg:mt-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsAttendanceModalOpen(true);
                            }}
                            className="flex-1 lg:flex-none px-6 py-3 bg-blue-950 text-white text-sm font-bold hover:bg-blue-900 active:scale-95 transition-all whitespace-nowrap"
                        >
                            {canMarkAttendance ? "Mark Attendance" : "View Attendance"}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMonthlyReportOpen(true);
                            }}
                            className="flex-1 lg:flex-none px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-750 active:scale-95 transition-all whitespace-nowrap"
                        >
                             Report
                        </button>
                        
                        <div className="flex items-center gap-2 ml-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const shareLink = `${window.location.origin}/attendance/${batch.shareToken}`;
                                    navigator.clipboard.writeText(shareLink).then(() => {
                                        toast.info("Link copied!");
                                    });
                                }}
                                className="p-3 text-gray-400 hover:text-blue-950 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                title="Share Attendance Link"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>

                            {canEdit && (
                                <>
                                    <button
                                        onClick={handleEdit}
                                        className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                        title="Edit Batch"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                        title="Delete Batch"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                            
                            <div className={`p-1.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-gray-100 dark:bg-gray-700' : ''}`}>
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-6 bg-blue-800" />
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white">Enrolled Students</h4>
                        </div>
                        <BatchStudentList
                            batchId={batch._id}
                            batchSubject={batch.subject}
                            batchStartDate={batch.startDate}
                            batchEndDate={batch.expectedEndDate}
                            brandName={batch.brand?.name}
                            batchModuleId={batch.moduleId}
                        />
                    </div>
                )}
            </div>

            <AttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                batch={batch}
            />
            <MonthlyAttendanceModal
                isOpen={isMonthlyReportOpen}
                onClose={() => setIsMonthlyReportOpen(false)}
                batch={batch}
            />

            {isEditModalOpen && (
                <CreateBatchModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdated={handleBatchUpdated}
                    batch={batch}
                />
            )}
        </div>
    );
}
