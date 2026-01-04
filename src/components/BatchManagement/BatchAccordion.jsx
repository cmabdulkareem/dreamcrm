import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import BatchStudentList from './BatchStudentList';
import AttendanceModal from './AttendanceModal';
import MonthlyAttendanceModal from './MonthlyAttendanceModal';
import { useAuth } from '../../context/AuthContext';
import { hasRole, isAdmin, isOwner } from '../../utils/roleHelpers';
import { GroupIcon } from '../../icons';

export default function BatchAccordion({ batch, onUpdate, onDelete }) {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({ ...batch });
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

    // Permission check for button text
    const isInstructor = (user && batch && user.fullName === batch.instructorName) || hasRole(user, 'Faculty / Trainers');
    const canMarkAttendance = isAdmin(user) || isOwner(user) || isInstructor;

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
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${API}/batches/${batch._id}`, editFormData, { withCredentials: true });
            toast.success("Batch updated successfully.");
            onUpdate(response.data.batch);
            setIsEditing(false);
        } catch (error) {
            toast.error("Failed to update batch.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('batchTime.')) {
            const field = name.split('.')[1];
            setEditFormData(prev => ({
                ...prev,
                batchTime: { ...prev.batchTime, [field]: value }
            }));
        } else {
            setEditFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            {/* Accordion Header */}
            <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={handleToggle}
            >
                <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
                    <div className={`transform transition-transform mt-1 sm:mt-0 ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{batch.batchName}</h4>
                        <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                                <span className="font-medium text-gray-500 mr-2">Subject:</span>
                                <span>{batch.subject}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-medium text-gray-500 mr-2">Duration:</span>
                                <span>{new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.expectedEndDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-medium text-gray-500 mr-2">Timing:</span>
                                <span>{batch.batchTime.from} - {batch.batchTime.to}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-medium text-gray-500 mr-2">Mode:</span>
                                <span className={`uppercase font-bold text-xs px-2 py-0.5 rounded ${batch.mode === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                    {batch.mode}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-medium text-gray-500 mr-2">Instructor:</span>
                                <span>{batch.instructorName}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAttendanceModalOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        {canMarkAttendance ? "Mark Attendance" : "View Attendance"}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMonthlyReportOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-full hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                    >
                        Monthly Report
                    </button>
                    <button
                        onClick={handleEdit}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Edit Batch"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete Batch"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                    {isEditing ? (
                        <form onSubmit={handleSave} className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Batch Name</label>
                                    <input
                                        type="text"
                                        name="batchName"
                                        value={editFormData.batchName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Instructor Assigned</label>
                                    <input
                                        type="text"
                                        name="instructorName"
                                        value={editFormData.instructorName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Mode</label>
                                    <select
                                        name="mode"
                                        value={editFormData.mode}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="online">Online</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                </div>
                                <div className="flex space-x-2">
                                    <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">Save</button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Cancel</button>
                                </div>
                            </div>
                        </form>
                    ) : null}

                    <div className="mt-6">
                        <h5 className="text-md font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <GroupIcon className="h-5 w-5 mr-2 text-gray-400" />
                            Enrolled Students
                        </h5>
                        <BatchStudentList batchId={batch._id} />
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
        </div>
    );
}
