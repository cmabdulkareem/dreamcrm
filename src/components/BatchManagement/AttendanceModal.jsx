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
                        records[rec.studentId] = { status: rec.status, remarks: rec.remarks, studentName: rec.studentName };
                    });

                    // Merge historical students (those in records but not in current batch)
                    const activeIds = new Set(studentList.map(s => s._id));
                    const historicalStudents = existingRecord.records
                        .filter(rec => !activeIds.has(rec.studentId))
                        .map(rec => ({
                            _id: rec.studentId,
                            studentName: rec.studentName,
                            phoneNumber: 'Historical Record',
                            isHistorical: true
                        }));
                    if (historicalStudents.length > 0) {
                        setStudents([...studentList, ...historicalStudents]);
                    }
                } else {
                    // Initialize default status
                    const isSunday = new Date(date).getDay() === 0;
                    const defaultStatus = isHoliday ? 'Holiday' : (isSunday ? 'Week Off' : 'Present');

                    studentList.forEach(s => {
                        records[s._id] = { status: defaultStatus, remarks: '', studentName: s.studentName };
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
                    records[s._id] = { status: defaultStatus, remarks: '', studentName: s.studentName };
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
            const recordsArray = Object.keys(attendanceRecords).map(studentId => {
                const s = students.find(stud => stud._id === studentId);
                return {
                    studentId,
                    studentName: s?.studentName || attendanceRecords[studentId].studentName || "Unknown",
                    status: attendanceRecords[studentId].status,
                    remarks: attendanceRecords[studentId].remarks
                };
            });

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
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-950 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                {canEdit ? "Attendance Registry" : "Attendance Archive"}
                            </span>
                            <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    {batch?.batchName}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {canEdit ? "Mark Daily Attendance" : "View Attendance Record"}
                            </h3>
                            {canChangeDate ? (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="text-xs p-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const shareLink = `${window.location.origin}/public/attendance/${batch.shareToken}`;
                                            navigator.clipboard.writeText(shareLink).then(() => {
                                                toast.info("Attendance link copied!");
                                            });
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-950 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-800"
                                        title="Share Attendance Link"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const shareLink = `${window.location.origin}/public/attendance/${batch.shareToken}`;
                                            navigator.clipboard.writeText(shareLink).then(() => {
                                                toast.info("Attendance link copied!");
                                            });
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-950 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-800"
                                        title="Share Attendance Link"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 text-sm custom-scrollbar">
                    {loading ? (
                        <LoadingSpinner className="py-20" />
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/80">Student Profile</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/80">Attendance Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                        {students.map(student => {
                                            const isInactive = student.studentId?.academicStatus === 'Inactive';
                                            return (
                                                <tr key={student._id} className={isInactive ? "opacity-60 bg-gray-50/50 dark:bg-gray-800/20" : ""}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                                    {student.studentName}
                                                                </div>
                                                                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mt-0.5">{student.phoneNumber}</div>
                                                            </div>
                                                            {isInactive && (
                                                                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-[9px] font-black uppercase tracking-wider">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                            {student.isHistorical && (
                                                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-wider">
                                                                    Removed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectableStatuses.map(status => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => handleStatusChange(student._id, status)}
                                                                    disabled={!canEdit || isInactive || student.isHistorical}
                                                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all border 
                                                                    ${attendanceRecords[student._id]?.status === status
                                                                            ? (status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 shadow-sm' :
                                                                               status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50 shadow-sm' :
                                                                               status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50 shadow-sm' :
                                                                               'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50 shadow-sm')
                                                                            : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
                                                                        }
                                                                    ${(!canEdit || isInactive || student.isHistorical) ? 'cursor-default opacity-80' : 'hover:scale-105'}
                                                                `}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                            {isInactive && (
                                                                <p className="text-[9px] font-bold text-gray-400 mt-1 italic w-full">Attendance disabled for inactive students. Reactivate in Manage Students.</p>
                                                            )}
                                                            {student.isHistorical && (
                                                                <p className="text-[9px] font-bold text-rose-400 mt-1 italic w-full">Attendance is read-only for students removed from the batch.</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden">
                                <div className="space-y-4">
                                    {students.map(student => {
                                        const isInactive = student.studentId?.academicStatus === 'Inactive';
                                        return (
                                            <div key={student._id} className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm ${isInactive ? "opacity-60 grayscale-[0.5]" : ""}`}>
                                                <div className="mb-3 flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {student.studentName}
                                                        </h4>
                                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mt-0.5">{student.phoneNumber}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {isInactive && (
                                                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-wider">Inactive</span>
                                                        )}
                                                        {student.isHistorical && (
                                                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-wider">Removed</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectableStatuses.map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusChange(student._id, status)}
                                                            disabled={!canEdit || isInactive || student.isHistorical}
                                                            className={`w-9 h-9 flex items-center justify-center text-[11px] font-black transition-all border
                                                            ${attendanceRecords[student._id]?.status === status
                                                                    ? (status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                       status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                       status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                       'bg-blue-50 text-blue-700 border-blue-100')
                                                                    : 'bg-white text-gray-500 border-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
                                                                }
                                                            ${(!canEdit || isInactive || student.isHistorical) ? 'cursor-default opacity-80' : 'active:scale-95'}
                                                        `}
                                                        >
                                                            {status.charAt(0)}
                                                        </button>
                                                    ))}
                                                </div>
                                                {isInactive && (
                                                    <p className="text-[9px] font-bold text-gray-400 mt-2 italic">Attendance disabled for inactive students.</p>
                                                )}
                                                {student.isHistorical && (
                                                    <p className="text-[9px] font-bold text-rose-400 mt-2 italic">Attendance is read-only for removed students.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-auto p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0 bg-gray-50/30 dark:bg-gray-900/50">
                    <Button variant="outline" onClick={onClose} className="px-5 font-bold uppercase text-[10px] tracking-widest">
                        Discard
                    </Button>
                    {canEdit && (
                        <Button 
                            variant="primary" 
                            onClick={handleSubmit} 
                            loading={submitting} 
                            className="px-8 !bg-blue-950 hover:!bg-blue-900 text-white font-bold uppercase text-[10px] tracking-widest border-none shadow-lg shadow-blue-900/10"
                        >
                            Commit Attendance
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
