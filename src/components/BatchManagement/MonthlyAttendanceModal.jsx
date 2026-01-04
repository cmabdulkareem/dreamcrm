import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import axios from 'axios';
import API from '../../config/api';
import { toast } from 'react-toastify';

export default function MonthlyAttendanceModal({ isOpen, onClose, batch }) {
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [attendanceData, setAttendanceData] = useState([]);
    const [students, setStudents] = useState([]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Generate years (e.g., current year - 1 to current year + 1)
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    useEffect(() => {
        if (isOpen && batch) {
            fetchData();
        }
    }, [isOpen, batch, selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch students
            const studentsRes = await axios.get(`${API}/batches/${batch._id}/students`, { withCredentials: true });
            const studentList = studentsRes.data.students;
            setStudents(studentList);

            // Fetch monthly attendance
            const attendanceRes = await axios.get(`${API}/batches/${batch._id}/attendance?month=${selectedMonth}&year=${selectedYear}`, { withCredentials: true });
            setAttendanceData(attendanceRes.data.attendance);

        } catch (error) {
            console.error("Failed to fetch monthly attendance:", error);
            toast.error("Failed to load attendance report.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get days in month
    const getDaysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Process data for table
    // structuredData = { studentId: { day: status } }
    // stats = { studentId: { present: count, absent: count, total: count } }
    const processAttendance = () => {
        const studentMap = {}; // studentId -> { day: status }
        const statsMap = {}; // studentId -> { present, absent, late, excused, totalSessions }

        // Initialize
        students.forEach(s => {
            studentMap[s._id] = {};
            statsMap[s._id] = { present: 0, absent: 0, late: 0, excused: 0, totalSessions: 0 };
        });

        attendanceData.forEach(record => {
            const recordDate = new Date(record.date);
            const day = recordDate.getDate();

            record.records.forEach(studentRec => {
                if (studentMap[studentRec.studentId]) {
                    studentMap[studentRec.studentId][day] = studentRec.status;

                    // Update stats
                    if (statsMap[studentRec.studentId]) {
                        const s = statsMap[studentRec.studentId];
                        if (studentRec.status === 'Holiday') {
                            // Do not increment totalSessions for holidays?
                            // Or maybe we treat it as neutral.
                            // For now let's NOT increment totalSessions so it doesn't affect %
                        } else {
                            s.totalSessions++;
                            if (studentRec.status === 'Present') s.present++;
                            else if (studentRec.status === 'Absent') s.absent++;
                            else if (studentRec.status === 'Late') s.late++;
                            else if (studentRec.status === 'Excused') s.excused++;
                        }
                    }
                }
            });
        });

        return { studentMap, statsMap };
    };

    const { studentMap, statsMap } = processAttendance();

    // Render Status Cell
    const renderStatusCell = (status) => {
        if (!status) return <span className="text-gray-200 text-xs">-</span>;

        let colorClass = "text-gray-500";
        let label = status.charAt(0);

        switch (status) {
            case 'Present': colorClass = "text-green-600 bg-green-100 font-bold"; break;
            case 'Absent': colorClass = "text-red-600 bg-red-100 font-bold"; break;
            case 'Late': colorClass = "text-yellow-600 bg-yellow-100 font-bold"; break;
            case 'Excused': colorClass = "text-blue-600 bg-blue-100 font-bold"; break;
            case 'Holiday': colorClass = "text-purple-600 bg-purple-100 font-bold"; break;
            default: break;
        }

        return (
            <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs mx-auto ${colorClass}`}>
                {label}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl p-6 h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0 pr-10 sm:pr-12">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Monthly Attendance Report - {batch?.batchName}
                </h3>
                <div className="flex gap-4">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
                {loading ? (
                    <div className="flex items-center justify-center h-full">Loading...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-20 border-r dark:border-gray-600 min-w-[200px]">
                                    Student Name
                                </th>
                                {daysArray.map(day => (
                                    <th key={day} className="px-1 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 min-w-[32px]">
                                        {day}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 sticky right-0 z-20 border-l dark:border-gray-600">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 sticky right-0 z-20 border-l dark:border-gray-600">
                                    %
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {students.map(student => {
                                const stats = statsMap[student._id] || { present: 0, totalSessions: 0 };
                                const percentage = stats.totalSessions > 0
                                    ? Math.round((stats.present / stats.totalSessions) * 100)
                                    : 0;

                                return (
                                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r dark:border-gray-600">
                                            {student.studentName}
                                        </td>
                                        {daysArray.map(day => (
                                            <td key={day} className="px-1 py-1 text-center border-l border-gray-100 dark:border-gray-700">
                                                {renderStatusCell(studentMap[student._id]?.[day])}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-center text-sm text-gray-900 dark:text-white sticky right-0 bg-white dark:bg-gray-800 z-10 border-l dark:border-gray-600 font-semibold">
                                            <span className="text-green-600">{stats.present}</span> / {stats.totalSessions}
                                        </td>
                                        <td className="px-4 py-2 text-center text-sm sticky right-0 bg-white dark:bg-gray-800 z-10 border-l dark:border-gray-600 font-bold">
                                            <span className={percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                                {percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-4 flex justify-end shrink-0">
                <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
}
