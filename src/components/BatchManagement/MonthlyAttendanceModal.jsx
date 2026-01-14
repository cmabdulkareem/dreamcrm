import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import axios from 'axios';
import API from '../../config/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

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
        const statsMap = {}; // studentId -> { present, absent, late, excused, holiday, totalSessions }
        const monthlySummary = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0 };
        const dailyStats = {}; // day -> { present, absent, etc }

        const today = new Date();
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const batchStart = batch?.startDate ? new Date(batch.startDate) : new Date(0);
        const batchStartNormalized = new Date(batchStart.getFullYear(), batchStart.getMonth(), batchStart.getDate());

        // Initialize maps
        students.forEach(s => {
            studentMap[s._id] = {};
            statsMap[s._id] = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0, totalSessions: 0 };
        });

        const firstMarkMap = {}; // studentId -> earliest Date object

        // 1. Map existing attendance data
        attendanceData.forEach(record => {
            const recordDate = new Date(record.date);
            const day = recordDate.getDate();

            record.records.forEach(studentRec => {
                if (studentMap[studentRec.studentId]) {
                    studentMap[studentRec.studentId][day] = studentRec.status;

                    // Track earliest mark
                    if (!firstMarkMap[studentRec.studentId] || recordDate < firstMarkMap[studentRec.studentId]) {
                        firstMarkMap[studentRec.studentId] = recordDate;
                    }
                }
            });
        });

        // 2. Process each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(selectedYear, selectedMonth - 1, day);

            // Only consider dates within [batchStart, today]
            if (currentDate >= batchStartNormalized && currentDate <= todayNormalized) {

                // Ensure dailyStats exists for this valid working day
                if (!dailyStats[day]) {
                    dailyStats[day] = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0 };
                }

                students.forEach(student => {
                    const studentJoinDate = new Date(student.createdAt);
                    studentJoinDate.setHours(0, 0, 0, 0);

                    // The actual start date is the EARLIEST of their CRM creation or their first recorded attendance
                    let studentEffectiveStart = studentJoinDate;
                    if (firstMarkMap[student._id] && firstMarkMap[student._id] < studentEffectiveStart) {
                        studentEffectiveStart = new Date(firstMarkMap[student._id]);
                        studentEffectiveStart.setHours(0, 0, 0, 0);
                    }

                    // Still cap it at the batch start for "unmarked" calculations
                    if (studentEffectiveStart < batchStartNormalized) {
                        studentEffectiveStart = batchStartNormalized;
                    }

                    const sStats = statsMap[student._id];
                    let status = studentMap[student._id][day];

                    let isConsideredSession = false;
                    let finalStatus = status;

                    if (status) {
                        // If any status exists (P, A, L, E, H), it's a valid day to count (unless it's a Holiday)
                        if (status !== 'Holiday') {
                            isConsideredSession = true;
                        }
                    } else if (currentDate >= studentEffectiveStart) {
                        // Unmarked day after joining - counts as Present (with Sunday logic)
                        isConsideredSession = true;

                        if (currentDate.getDay() === 0) { // Sunday Rule
                            const satInMonth = day > 1;
                            const monInMonth = day < daysInMonth;
                            const yesterday = new Date(currentDate.getTime() - 86400000);
                            const tomorrow = new Date(currentDate.getTime() + 86400000);

                            // Bounds check
                            const satInRange = yesterday >= studentEffectiveStart;
                            const monInRange = tomorrow <= todayNormalized;

                            const satAbsent = satInMonth && satInRange && (studentMap[student._id][day - 1] === 'Absent');
                            const monAbsent = monInMonth && monInRange && (studentMap[student._id][day + 1] === 'Absent');

                            let isSundayAbsent = false;
                            if (satInRange && monInRange) {
                                isSundayAbsent = satAbsent && monAbsent;
                            } else if (satInRange) {
                                isSundayAbsent = satAbsent;
                            } else if (monInRange) {
                                isSundayAbsent = monAbsent;
                            }

                            finalStatus = isSundayAbsent ? 'Absent' : 'Present';
                            studentMap[student._id][day] = finalStatus; // Store it for UI
                        } else {
                            finalStatus = 'Present';
                            studentMap[student._id][day] = 'Present'; // Store it for UI
                        }
                    }

                    if (!isConsideredSession) {
                        // If it's a Holiday or before joining, update dailyStats/monthlySummary if it was a Holiday
                        if (status === 'Holiday') {
                            sStats.holiday++;
                            monthlySummary.holiday++;
                            dailyStats[day].holiday++;
                        }
                        return;
                    }

                    // Process working day
                    sStats.totalSessions++;
                    if (finalStatus === 'Absent') {
                        sStats.absent++;
                        monthlySummary.absent++;
                        dailyStats[day].absent++;
                    } else {
                        sStats.present++;
                        if (finalStatus === 'Present') {
                            monthlySummary.present++;
                            dailyStats[day].present++;
                        } else if (finalStatus === 'Late') {
                            sStats.late++;
                            monthlySummary.late++;
                            dailyStats[day].late++;
                        } else if (finalStatus === 'Excused') {
                            sStats.excused++;
                            monthlySummary.excused++;
                            dailyStats[day].excused++;
                        }
                    }
                });
            }
        }

        return { studentMap, statsMap, monthlySummary, dailyStats };
    };

    const { studentMap, statsMap, monthlySummary, dailyStats } = processAttendance();

    // Render Status Cell
    const renderStatusCell = (status) => {
        if (!status) return <span className="text-gray-200 text-xs">-</span>;

        let colorClass = "text-gray-500";
        let label = status.charAt(0);

        switch (status) {
            case 'Present': colorClass = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"; break;
            case 'Absent': colorClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"; break;
            case 'Late': colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"; break;
            case 'Excused': colorClass = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"; break;
            case 'Holiday': colorClass = "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"; break;
            default: colorClass = "bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800/50 dark:text-gray-600 dark:border-gray-800"; break;
        }

        return (
            <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold mx-auto border ${colorClass}`}>
                {label}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl p-6 h-[90vh] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0 pr-10 sm:pr-12">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Monthly Attendance Report - {batch?.batchName}
                </h3>
                <div className="flex gap-3 sm:gap-4">
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

            {/* Attendance Legend & Monthly Summary Indicators */}
            {!loading && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 shrink-0">
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 tracking-widest">Monthly Status Indicators</div>
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                        {[
                            { l: 'P', n: 'Present', c: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400', count: monthlySummary.present },
                            { l: 'A', n: 'Absent', c: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400', count: monthlySummary.absent },
                            { l: 'L', n: 'Late', c: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', count: monthlySummary.late },
                            { l: 'E', n: 'Excused', c: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', count: monthlySummary.excused },
                            { l: 'H', n: 'Holiday', c: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400', count: monthlySummary.holiday }
                        ].map(item => (
                            <div key={item.l} className="flex items-center gap-3">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shadow-sm ${item.c}`}>
                                    {item.l}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">{item.n}</span>
                                    <span className="text-sm font-bold text-gray-800 dark:text-white leading-none">{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto border rounded-lg">
                {loading ? (
                    <LoadingSpinner className="h-full" />
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-20 border-r dark:border-gray-600 min-w-[150px] sm:min-w-[200px]">
                                    Student Name
                                </th>
                                {daysArray.map(day => {
                                    const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                    const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()];
                                    const isSunday = dateObj.getDay() === 0;
                                    return (
                                        <th key={day} className={`px-1 py-2 text-center text-[10px] font-medium min-w-[32px] border-l dark:border-gray-600 ${isSunday ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 dark:text-gray-300'}`}>
                                            <div className="mb-0.5">{dayName}</div>
                                            <div className="text-[11px]">{day}</div>
                                        </th>
                                    );
                                })}
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
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r dark:border-gray-600 max-w-[150px] sm:max-w-none truncate">
                                            {student.studentName}
                                        </td>
                                        {daysArray.map(day => {
                                            const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                            const isSunday = dateObj.getDay() === 0;
                                            return (
                                                <td key={day} className={`px-1 py-1 text-center border-l border-gray-100 dark:border-gray-700 ${isSunday ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                                                    {renderStatusCell(studentMap[student._id]?.[day])}
                                                </td>
                                            );
                                        })}
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
                        <tfoot className="bg-gray-50 dark:bg-gray-700/30 sticky bottom-0 z-10">
                            <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                                <td className="px-4 py-2 font-bold text-[10px] uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 border-r dark:border-gray-600">
                                    Total Presents
                                </td>
                                {daysArray.map(day => (
                                    <td key={day} className="px-1 py-1 text-center font-bold text-[11px] border-l border-gray-100 dark:border-gray-700 text-green-600">
                                        {dailyStats[day]?.present || 0}
                                    </td>
                                ))}
                                <td colSpan={2} className="bg-gray-50 dark:bg-gray-700"></td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 font-bold text-[10px] uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 border-r dark:border-gray-600">
                                    Total Absents
                                </td>
                                {daysArray.map(day => (
                                    <td key={day} className="px-1 py-1 text-center font-bold text-[11px] border-l border-gray-100 dark:border-gray-700 text-red-600">
                                        {dailyStats[day]?.absent || 0}
                                    </td>
                                ))}
                                <td colSpan={2} className="bg-gray-50 dark:bg-gray-700"></td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            <div className="mt-6 flex justify-end shrink-0">
                <Button variant="outline" onClick={onClose} className="px-6 py-2.5">Close</Button>
            </div>
        </Modal >
    );
}
