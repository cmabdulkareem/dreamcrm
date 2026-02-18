import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import axios from 'axios';
import API from '../../config/api';
import { toast } from 'react-toastify';
import { hasRole, isAdmin, isOwner, isManager, isAcademicCoordinator } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AttendanceModal({ isOpen, onClose, batch }) {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: { status, remarks } }
    const [viewMode, setViewMode] = useState(false); // If true, only viewing past attendance

    // Permissions
    const isInstructor = (user && batch && user.fullName === batch.instructorName) || hasRole(user, 'Instructor');
    // Owners and Managers can change the date for past attendance
    const canChangeDate = (isAdmin(user) || isOwner(user) || isManager(user)) && !isAcademicCoordinator(user);
    // Instructors, Owners, Managers can edit. Academic Coordinators can only VIEW.
    const canEdit = (isAdmin(user) || isOwner(user) || isManager(user) || isInstructor) && !isAcademicCoordinator(user);

    useEffect(() => {
        if (isOpen && batch) {
            // Always force date to today local
            setDate(new Date().toLocaleDateString('en-CA'));
            fetchStudentsAndAttendance();
        }
    }, [isOpen, batch]);

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            // Fetch students
            const studentsRes = await axios.get(`${API}/batches/${batch._id}/students`, { withCredentials: true });
            const studentList = studentsRes.data.students;
            setStudents(studentList);

            // Fetch existing attendance for the date
            try {
                // Also fetch holidays to check if current date is a holiday
                const holidaysRes = await axios.get(`${API}/holidays`, { withCredentials: true });
                const holidays = holidaysRes.data.holidays || [];
                const isHoliday = holidays.some(h => new Date(h.date).toLocaleDateString('en-CA') === date);

                const attendanceRes = await axios.get(`${API}/batches/${batch._id}/attendance?date=${date}`, { withCredentials: true });
                const existingRecord = attendanceRes.data.attendance[0];

                const records = {};
                if (existingRecord) {
                    existingRecord.records.forEach(rec => {
                        records[rec.studentId] = { status: rec.status, remarks: rec.remarks };
                    });
                } else {
                    // Initialize default status
                    const isSunday = new Date(date).getDay() === 0;
                    const defaultStatus = isHoliday ? 'Holiday' : (isSunday ? 'Week Off' : 'Present');

                    studentList.forEach(s => {
                        records[s._id] = { status: defaultStatus, remarks: '' };
                    });
                }
                setAttendanceRecords(records);
            } catch (err) {
                console.error("No existing attendance found or error fetching", err);
                // Fallback for default initialization if attendance fetch fails
                const holidaysRes = await axios.get(`${API}/holidays`, { withCredentials: true }).catch(() => ({ data: { holidays: [] } }));
                const holidays = holidaysRes.data.holidays || [];
                const isHoliday = holidays.some(h => new Date(h.date).toLocaleDateString('en-CA') === date);

                const records = {};
                const isSunday = new Date(date).getDay() === 0;
                const defaultStatus = isHoliday ? 'Holiday' : (isSunday ? 'Week Off' : 'Present');

                studentList.forEach(s => {
                    records[s._id] = { status: defaultStatus, remarks: '' };
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

    const selectableStatuses = ["Present", "Absent", "Late", "Excused", "Week Off"];

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-0 h-[85vh] flex flex-col">
            <div className="flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 shrink-0 pr-12 sm:pr-14">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                            {canEdit ? "Mark Attendance" : "View Attendance"}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {canChangeDate ? "Owner/Manager Access: Custom date allowed" : "Fixed Date Mode"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {canChangeDate && (
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="text-xs sm:text-sm p-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                        )}
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                            {batch?.batchName} {!canChangeDate && `| ${new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm">
                    {loading ? (
                        <LoadingSpinner className="py-20" />
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {students.map(student => (
                                            <tr key={student._id}>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    <div>{student.studentName}</div>
                                                    <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">{student.phoneNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectableStatuses.map(status => (
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
                                                                                        status === 'Week Off' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                                                                            status === 'Excused' ? 'bg-blue-100 text-blue-800 border-blue-200' :
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

                            <div className="md:hidden">
                                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 italic">Attendance Legend</div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {[
                                            { l: 'P', n: 'Present', c: 'bg-green-100 text-green-800 border-green-200' },
                                            { l: 'A', n: 'Absent', c: 'bg-red-100 text-red-800 border-red-200' },
                                            { l: 'L', n: 'Late', c: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                                            { l: 'E', n: 'Excused', c: 'bg-blue-100 text-blue-800 border-blue-200' },
                                            { l: 'E', n: 'Excused', c: 'bg-blue-100 text-blue-800 border-blue-200' },
                                            { l: 'W', n: 'Week Off', c: 'bg-gray-100 text-gray-800 border-gray-200' }
                                        ].map(item => (
                                            <div key={item.l} className="flex items-center gap-1.5">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${item.c}`}>
                                                    {item.l}
                                                </span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300">{item.n}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {students.map(student => (
                                        <div key={student._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                            <div className="mb-3">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {student.studentName}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{student.phoneNumber}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectableStatuses.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(student._id, status)}
                                                        disabled={!canEdit}
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors border
                                                        ${attendanceRecords[student._id]?.status === status
                                                                ? (status === 'Present' ? 'bg-green-100 text-green-800 border-green-200' :
                                                                    status === 'Absent' ? 'bg-red-100 text-red-800 border-red-200' :
                                                                        status === 'Late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                                            status === 'Holiday' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                                                status === 'Week Off' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                                                                    'bg-blue-100 text-blue-800 border-blue-200')
                                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                                                            }
                                                        ${!canEdit ? 'cursor-default opacity-80' : ''}
                                                    `}
                                                    >
                                                        {status.charAt(0)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-auto p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={onClose} className="px-4 py-2">Close</Button>
                    {canEdit && (
                        <Button variant="primary" onClick={handleSubmit} loading={submitting} className="px-6 py-2">
                            Save Attendance
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
