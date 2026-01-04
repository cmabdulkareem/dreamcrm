import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import axios from 'axios';
import API from '../../config/api';
import { toast } from 'react-toastify';
import { hasRole, isAdmin, isOwner, isManager } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceModal({ isOpen, onClose, batch }) {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: { status, remarks } }
    const [viewMode, setViewMode] = useState(false); // If true, only viewing past attendance

    // Permissions
    const isInstructor = (user && batch && user.fullName === batch.instructorName) || hasRole(user, 'Instructor');
    // Strict restriction: no one can change date. Attendance is always for TODAY.
    const canChangeDate = false;
    const canEdit = isAdmin(user) || isOwner(user) || isManager(user) || isInstructor;

    useEffect(() => {
        if (isOpen && batch) {
            // Always force date to today
            setDate(new Date().toISOString().split('T')[0]);
            fetchStudentsAndAttendance();
        }
    }, [isOpen, batch]);
    // Need to act on date change too, but fetchStudentsAndAttendance already depends on date.

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            // Fetch students
            const studentsRes = await axios.get(`${API}/batches/${batch._id}/students`, { withCredentials: true });
            const studentList = studentsRes.data.students;
            setStudents(studentList);

            // Fetch existing attendance for the date
            try {
                const attendanceRes = await axios.get(`${API}/batches/${batch._id}/attendance?date=${date}`, { withCredentials: true });
                const existingRecord = attendanceRes.data.attendance[0]; // Assuming getAttendance returns array sorted by date

                const records = {};
                if (existingRecord) {
                    existingRecord.records.forEach(rec => {
                        records[rec.studentId] = { status: rec.status, remarks: rec.remarks };
                    });
                } else {
                    // Initialize default 'Present' for all students if new record
                    studentList.forEach(s => {
                        records[s._id] = { status: 'Present', remarks: '' };
                    });
                }
                setAttendanceRecords(records);
            } catch (err) {
                console.error("No existing attendance found or error fetching", err);
                // Initialize default
                const records = {};
                studentList.forEach(s => {
                    records[s._id] = { status: 'Present', remarks: '' };
                });
                setAttendanceRecords(records);
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load students.");
        } finally {
            setLoading(false);
        }
    };

    const isDateWithinBatchRange = (checkDate) => {
        if (!batch) return false;
        const d = new Date(checkDate);
        const start = new Date(batch.startDate);
        const end = new Date(batch.expectedEndDate);
        // Normalize
        d.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
    };

    const handleStatusChange = (studentId, status) => {
        if (!canEdit) return;
        if (!isDateWithinBatchRange(date)) {
            toast.error("Attendance date must be within batch duration.");
            return;
        }
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        if (!canEdit) return;
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks }
        }));
    };

    const handleSubmit = async () => {
        if (!canEdit) return;
        if (!isDateWithinBatchRange(date)) {
            toast.error("Cannot mark attendance outside of batch dates.");
            return;
        }
        setSubmitting(true);
        try {
            const recordsArray = Object.keys(attendanceRecords).map(studentId => ({
                studentId,
                status: attendanceRecords[studentId].status,
                remarks: attendanceRecords[studentId].remarks
            }));

            await axios.post(`${API}/batches/${batch._id}/attendance`, {
                date,
                records: recordsArray
            }, { withCredentials: true });

            toast.success("Attendance marked successfully!");
            onClose();
        } catch (error) {
            console.error("Error marking attendance:", error);
            toast.error(error.response?.data?.message || "Failed to mark attendance.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Helper to format date for input min/max
    const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pr-10 sm:pr-12">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {canEdit ? "Mark Attendance" : "View Attendance"} - {batch?.batchName}
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {students.map(student => (
                                    <tr key={student._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {student.studentName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex gap-2">
                                                {["Present", "Absent", "Late", "Excused", "Holiday"].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(student._id, status)}
                                                        disabled={!canEdit}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border 
                                                            ${attendanceRecords[student._id]?.status === status
                                                                ? (status === 'Present' ? 'bg-green-100 text-green-800 border-green-200' :
                                                                    status === 'Absent' ? 'bg-red-100 text-red-800 border-red-200' :
                                                                        status === 'Late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                                            status === 'Holiday' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                                                'bg-blue-100 text-blue-800 border-blue-200')
                                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                                                            }
                                                            ${!canEdit ? 'cursor-default opacity-80' : ''}
                                                        `}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {students.map(student => (
                            <div key={student._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                    {student.studentName}
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {["Present", "Absent", "Late", "Excused", "Holiday"].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(student._id, status)}
                                            disabled={!canEdit}
                                            className={`px-2 py-2 rounded-md text-xs font-medium transition-colors border text-center
                                                ${attendanceRecords[student._id]?.status === status
                                                    ? (status === 'Present' ? 'bg-green-100 text-green-800 border-green-200' :
                                                        status === 'Absent' ? 'bg-red-100 text-red-800 border-red-200' :
                                                            status === 'Late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                                status === 'Holiday' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                                    'bg-blue-100 text-blue-800 border-blue-200')
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                                                }
                                                ${!canEdit ? 'cursor-default opacity-80' : ''}
                                            `}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Close</Button>
                {canEdit && (
                    <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                        Save Attendance
                    </Button>
                )}
            </div>
        </Modal>
    );
}
