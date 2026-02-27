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

    // Permission check for button text
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

    return (
        <div className="border border-gray-100 dark:border-gray-700/50 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 group hover:border-gray-200 dark:hover:border-gray-600">
            {/* Accordion Header */}
            <div
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 md:p-6 cursor-pointer group-hover:bg-gray-50/50 dark:group-hover:bg-gray-700/50 transition-colors"
                onClick={handleToggle}
            >
                {/* Left: Title + metadata */}
                <div className="flex items-start space-x-4 w-full lg:w-3/4">
                    <div className={`transform transition-transform mt-1.5 ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
                                {batch.batchName}
                            </h4>
                            <div className="flex items-center px-2.5 py-0.5 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-100 dark:border-gray-700">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-2 border-r border-gray-200 dark:border-gray-700 pr-2 leading-none">Instructor</span>
                                <span className="text-gray-600 dark:text-gray-300 font-semibold text-xs leading-none">{batch.instructorName}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5 text-sm">
                            {/* Subject */}
                            <div className="flex items-center px-3 py-1 bg-white dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-2">Subject</span>
                                <span className="text-gray-600 dark:text-gray-300 font-medium">{batch.subject}</span>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center px-3 py-1 bg-white dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-2">Duration</span>
                                <span className="text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                                    {new Date(batch.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(batch.expectedEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            {/* Timing */}
                            <div className="flex items-center px-3 py-1 bg-white dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-2">Timing</span>
                                <span className="text-gray-600 dark:text-gray-300 font-medium">{batch.batchTime.from} - {batch.batchTime.to}</span>
                            </div>

                            {/* Mode Dot */}
                            <div className="flex items-center self-center px-1.5" title={`Mode: ${batch.mode}`}>
                                <span className={`h-2.5 w-2.5 rounded-full ${batch.mode === 'online' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`}></span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 mt-6 lg:mt-0 w-full lg:w-1/4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAttendanceModalOpen(true);
                        }}
                        className="px-5 py-2 text-[13px] font-bold bg-blue-950 dark:bg-blue-900 text-white rounded-lg hover:bg-blue-900 dark:hover:bg-blue-800 active:scale-[0.98] transition-all min-w-[130px]"
                    >
                        {canMarkAttendance ? "Mark Attendance" : "View Attendance"}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMonthlyReportOpen(true);
                        }}
                        className="px-5 py-2 text-[13px] font-medium bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
                    >
                        Monthly Report
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const shareLink = `${window.location.origin}/public/attendance/${batch.shareToken}`;
                            navigator.clipboard.writeText(shareLink).then(() => {
                                toast.info("Shareable link copied to clipboard!");
                            }).catch(err => {
                                toast.error("Failed to copy link.");
                            });
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-900/40 transition-all active:scale-95"
                        title="Copy Shareable Link for Students"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>

                    {canEdit && (
                        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleEdit}
                                className="p-2 text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit Batch"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Batch"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="mt-6">
                        <h5 className="text-md font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <GroupIcon className="h-5 w-5 mr-2 text-gray-400" />
                            Enrolled Students
                        </h5>
                        <BatchStudentList
                            batchId={batch._id}
                            batchSubject={batch.subject}
                            batchStartDate={batch.startDate}
                            batchEndDate={batch.expectedEndDate}
                            brandName={batch.brand?.name}
                        />
                    </div>
                </div>
            )}

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
